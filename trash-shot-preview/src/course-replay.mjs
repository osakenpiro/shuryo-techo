import { validateReplay, replayToJSON, parseReplayJSON, encodeReplay, decodeReplay, buildReplayURL, createReplayPlayer, ReplayError } from './replay.mjs?v=20261011-first-chapter-1';
import { roomCourse } from './room-course.mjs?v=20261011-first-chapter-1';

// V1 remains the immutable pose codec. Its legacy "direct" role is not a
// statement about an outer course's desk; the outer result owns that distinction.
export const COURSE_REPLAY_LIMITS = Object.freeze({ version: 2, worldVersion: 1,
  rawBytes: 1024 * 1024, contacts: 2400, urlChars: 8000 });
const STAGES = new Set(['first', 'desk-over', 'desk-side', 'room-extra']);
const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', { fatal: true });
const fail = (code, message) => { throw new ReplayError(code, message); };
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const clone = value => JSON.parse(JSON.stringify(value));
const isV1 = value => value && typeof value === 'object' && Object.getOwnPropertyDescriptor(value, 'version')?.value === 1;
function object(value, keys, where) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail('INVALID_REPLAY', `${where}: plain object required`);
  const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
  if (names.length !== keys.length || names.some(key => typeof key !== 'string' || !keys.includes(key))
      || keys.some(key => !descriptors[key] || !('value' in descriptors[key]) || !descriptors[key].enumerable)) fail('INVALID_REPLAY', `${where}: unexpected keys or accessors`);
}
function number(value, min, max, where, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || integer && !Number.isInteger(value)) fail('INVALID_REPLAY', `${where}: number out of range`);
  return value;
}
function vector(value, where, normal = false) {
  object(value, ['x', 'y', 'z'], where);
  const p = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, number(value[axis], normal ? -1 : axis === 'y' ? 0 : -10, normal ? 1 : 10, `${where}.${axis}`)]));
  if (normal && Math.abs(Math.hypot(p.x, p.y, p.z) - 1) > 1e-6) fail('INVALID_REPLAY', 'Contact normal is not a unit vector');
  return p;
}
function contactArray(value) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > COURSE_REPLAY_LIMITS.contacts
      || Reflect.ownKeys(value).length !== value.length + 1) fail('INVALID_REPLAY', 'Invalid course contact array');
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) fail('INVALID_REPLAY', 'Sparse or accessor contact array');
  }
  return value;
}
function validateContact(value, course, duration) {
  object(value, ['type', 'surface', 'colliderId', 'shotId', 'time', 'position', 'normal', 'incomingNormalSpeed'], 'contact');
  const collider = course?.desk.colliders.find(box => box.id === value.colliderId);
  if (value.type !== 'desk-impact' || value.surface !== 'desk' || !collider) fail('INVALID_REPLAY', 'Unsupported course contact');
  const position = vector(value.position, 'contact.position'), normal = vector(value.normal, 'contact.normal', true);
  const difference = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, position[axis] - Math.max(collider.min[axis], Math.min(collider.max[axis], position[axis]))]));
  const distance = Math.hypot(difference.x, difference.y, difference.z);
  if (Math.abs(distance - .14) > 2e-4 || ['x', 'y', 'z'].some(axis => Math.abs(difference[axis] / distance - normal[axis]) > .002)) fail('INVALID_REPLAY', 'Contact does not lie on the fixed desk sphere surface');
  return { type: 'desk-impact', surface: 'desk', colliderId: collider.id,
    shotId: number(value.shotId, 1, Number.MAX_SAFE_INTEGER, 'contact.shotId', true),
    time: number(value.time, 0, duration, 'contact.time'), position, normal,
    incomingNormalSpeed: number(value.incomingNormalSpeed, .15, 100, 'contact.incomingNormalSpeed') };
}

export function validateCourseReplay(input) {
  if (isV1(input)) return validateReplay(input);
  object(input, ['version', 'kind', 'course', 'replay'], 'course replay');
  if (input.version !== 2 || input.kind !== 'room-course') fail('UNSUPPORTED_VERSION', 'Course replay version is unsupported');
  object(input.course, ['worldVersion', 'stageId', 'deskHits', 'contacts', 'fanEnabled'], 'course');
  const value = input.course;
  if (value.worldVersion !== 1 || !STAGES.has(value.stageId) || typeof value.fanEnabled !== 'boolean'
      || value.stageId !== 'room-extra' && value.fanEnabled) fail('INVALID_REPLAY', 'Unsupported fixed course world');
  const replay = validateReplay(input.replay), world = roomCourse(value.stageId);
  if (replay.bin.center.z !== 6 || replay.bin.height !== 1.3) fail('INVALID_REPLAY', 'Course bin differs from its fixed world');
  const contacts = contactArray(value.contacts).map(contact => validateContact(contact, world, replay.duration));
  const deskHits = number(value.deskHits, 0, COURSE_REPLAY_LIMITS.contacts, 'course.deskHits', true);
  if (deskHits !== contacts.length) fail('INVALID_REPLAY', 'Desk count and contact trace disagree');
  for (let i = 1; i < contacts.length; i++) if (contacts[i].time < contacts[i - 1].time || contacts[i].shotId !== contacts[0].shotId) fail('INVALID_REPLAY', 'Course contacts are out of shot order');
  const record = { version: 2, kind: 'room-course', course: { worldVersion: 1, stageId: value.stageId, deskHits, contacts, fanEnabled: value.fanEnabled }, replay };
  if (encoder.encode(JSON.stringify(record)).byteLength > COURSE_REPLAY_LIMITS.rawBytes) fail('REPLAY_TOO_LARGE', 'Course replay exceeds raw byte limit');
  return freeze(record);
}
export function createCourseReplay(coreV1, stageId, deskContacts = [], { fanEnabled = false } = {}) {
  contactArray(deskContacts);
  return validateCourseReplay({ version: 2, kind: 'room-course', course: { worldVersion: 1, stageId, deskHits: deskContacts.length, contacts: deskContacts, fanEnabled }, replay: coreV1 });
}
export function coursePayload(record) { const valid = validateCourseReplay(record); return valid.version === 1 ? valid : valid.replay; }
export function courseReplayResult(record) {
  const valid = validateCourseReplay(record), replay = valid.version === 1 ? valid : valid.replay;
  const result = clone(replay.result);
  const deskHits = valid.version === 1 ? 0 : valid.course.contacts.filter(contact => contact.time < result.finalEntryTime + 1e-8).length;
  if (deskHits) { result.roles = result.roles.filter(role => role.id !== 'direct'); result.roles.push({ id: 'desk-bank', label: '机当て' }); }
  return { ...result, deskHits };
}
export function createCourseReplayPlayer(record) { return createReplayPlayer(coursePayload(record)); }
export function courseReplayToJSON(record) { const valid = validateCourseReplay(record); return valid.version === 1 ? replayToJSON(valid) : JSON.stringify(valid); }
export function parseCourseReplayJSON(text) {
  if (typeof text !== 'string') fail('INVALID_REPLAY', 'Course replay JSON must be text');
  if (text.length > COURSE_REPLAY_LIMITS.rawBytes || encoder.encode(text).byteLength > COURSE_REPLAY_LIMITS.rawBytes) fail('REPLAY_TOO_LARGE', 'Course replay exceeds JSON byte limit');
  let value; try { value = JSON.parse(text); } catch { fail('INVALID_REPLAY', 'Malformed course replay JSON'); }
  return value?.version === 1 ? parseReplayJSON(text) : validateCourseReplay(value);
}

// Reuse the proven V1 bounded gzip/base64url recipe for an explicitly different
// fragment. Never hand a desk envelope to the legacy decoder or silently strip it.
async function readBounded(stream, limit) {
  const reader = stream.getReader(), chunks = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel().catch(() => {}); fail('REPLAY_TOO_LARGE', 'Course replay stream exceeds limit'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
function base64url(bytes) {
  let binary = ''; for (let i = 0; i < bytes.length; i += 4096) binary += String.fromCharCode(...bytes.subarray(i, i + 4096));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function unbase64url(text) {
  if (!text || !/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) fail('INVALID_ENCODING', 'Invalid base64url course replay');
  let binary; try { binary = atob(text.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - text.length % 4) % 4)); }
  catch { fail('INVALID_ENCODING', 'Invalid base64url course replay'); }
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  if (base64url(bytes) !== text) fail('INVALID_ENCODING', 'Noncanonical base64url course replay');
  return bytes;
}
export async function encodeCourseReplay(record) {
  if (isV1(record)) return encodeReplay(record);
  const json = courseReplayToJSON(record);
  if (typeof CompressionStream !== 'function') { const error = new ReplayError('COMPRESSION_UNAVAILABLE', 'Course replay URL compression unavailable'); error.fallbackJSON = json; throw error; }
  let bytes;
  try { bytes = await readBounded(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')), COURSE_REPLAY_LIMITS.rawBytes); }
  catch (error) { if (error instanceof ReplayError) throw error; fail('INVALID_ENCODING', 'Course replay compression failed'); }
  const fragment = `tsc2.${base64url(bytes)}`;
  if (fragment.length + 1 > COURSE_REPLAY_LIMITS.urlChars) { const error = new ReplayError('SHARE_TOO_LARGE', 'Course replay URL exceeds 8000 characters; use its file'); error.fallbackJSON = json; throw error; }
  return fragment;
}
export async function decodeCourseReplay(fragment) {
  if (typeof fragment !== 'string' || fragment.length > COURSE_REPLAY_LIMITS.urlChars) fail('SHARE_TOO_LARGE', 'Course replay fragment exceeds URL limit');
  const text = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (text.startsWith('tsr1.')) return decodeReplay(text);
  if (!text.startsWith('tsc2.')) fail('UNSUPPORTED_VERSION', 'Course replay fragment version is unsupported');
  const bytes = unbase64url(text.slice(5));
  if (typeof DecompressionStream !== 'function') fail('COMPRESSION_UNAVAILABLE', 'Course replay URL decompression unavailable');
  let decoded;
  try { decoded = await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')), COURSE_REPLAY_LIMITS.rawBytes); }
  catch (error) { if (error instanceof ReplayError) throw error; fail('INVALID_ENCODING', 'Invalid compressed course replay'); }
  let json; try { json = decoder.decode(decoded); } catch { fail('INVALID_ENCODING', 'Course replay is not UTF-8'); }
  const record = parseCourseReplayJSON(json);
  if (record.version !== 2) fail('UNSUPPORTED_VERSION', 'Course fragment cannot carry a bare V1 record');
  return record;
}
export async function buildCourseReplayURL(record, url) {
  if (isV1(record)) return buildReplayURL(record, url);
  let result; try { result = new URL(url); } catch { fail('INVALID_URL', 'Course replay URL base is invalid'); }
  if (!['http:', 'https:'].includes(result.protocol) || result.username || result.password) fail('INVALID_URL', 'Course replay URL must use HTTP or HTTPS');
  result.hash = await encodeCourseReplay(record);
  if (result.href.length > COURSE_REPLAY_LIMITS.urlChars) { const error = new ReplayError('SHARE_TOO_LARGE', 'Course replay URL exceeds 8000 characters; use its file'); error.fallbackJSON = courseReplayToJSON(record); throw error; }
  return result.href;
}
