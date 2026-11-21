// Локальное шифрование данных на устройстве (Web Crypto API: PBKDF2-SHA256 + AES-GCM 256-bit)
(function (global) {
  'use strict';

  const ITERATIONS = 150000;
  const VERIFIER_PLAINTEXT = 'HELPTOOL_IOS_VAULT_OK_V1';
  const LOCK_META_KEY = 'helptool_ios_pin_meta_v1';
  const BACKOFF_KEY = 'helptool_ios_pin_backoff_v1';

  const te = new TextEncoder();
  const td = new TextDecoder();

  function hasWebCrypto() {
    return Boolean(global.crypto && global.crypto.subtle && global.crypto.getRandomValues);
  }

  function bytesToBase64(bytes) {
    let bin = '';
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) {
      bin += String.fromCharCode(arr[i]);
    }
    return btoa(bin);
  }

  function base64ToBytes(b64) {
    const bin = atob(String(b64 || ''));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }

  function randomBytes(len) {
    const out = new Uint8Array(len);
    global.crypto.getRandomValues(out);
    return out;
  }

  async function deriveAesKey(pin, saltBytes) {
    const keyMat = await global.crypto.subtle.importKey(
      'raw',
      te.encode(String(pin)),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return global.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMat,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptJson(obj, cryptoKey) {
    const iv = randomBytes(12);
    const plain = te.encode(JSON.stringify(obj));
    const cipherBuf = await global.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plain);
    return {
      v: 1,
      alg: 'AES-GCM-256',
      iv: bytesToBase64(iv),
      ct: bytesToBase64(new Uint8Array(cipherBuf)),
    };
  }

  async function decryptJson(payload, cryptoKey) {
    if (!payload || !payload.iv || !payload.ct) {
      throw new Error('Повреждённый контейнер данных');
    }
    const iv = base64ToBytes(payload.iv);
    const ct = base64ToBytes(payload.ct);
    const plainBuf = await global.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ct);
    return JSON.parse(td.decode(plainBuf));
  }

  async function createPinBundle(pin, pinLength) {
    if (!hasWebCrypto()) {
      throw new Error('Шифрование доступно только по защищённому HTTPS-адресу');
    }
    const salt = randomBytes(16);
    const key = await deriveAesKey(pin, salt);
    const verifier = await encryptJson({ check: VERIFIER_PLAINTEXT }, key);
    const meta = {
      enabled: true,
      pinLength: pinLength === 6 ? 6 : 4,
      iterations: ITERATIONS,
      salt: bytesToBase64(salt),
      verifier,
      autoLockSec: 60,
    };
    return { meta, key };
  }

  async function verifyPin(pin, meta) {
    if (!meta || !meta.salt || !meta.verifier) {
      throw new Error('Настройки PIN не найдены');
    }
    const salt = base64ToBytes(meta.salt);
    const key = await deriveAesKey(pin, salt);
    try {
      const dec = await decryptJson(meta.verifier, key);
      if (dec && dec.check === VERIFIER_PLAINTEXT) {
        return key;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function encryptBackupWithPin(dataObj, pin) {
    if (!hasWebCrypto()) {
      throw new Error('Web Crypto недоступен');
    }
    const salt = randomBytes(16);
    const key = await deriveAesKey(pin, salt);
    const enc = await encryptJson(dataObj, key);
    return {
      format: 'helptool-ios-backup-encrypted-v1',
      createdAt: new Date().toISOString(),
      iterations: ITERATIONS,
      salt: bytesToBase64(salt),
      payload: enc,
    };
  }

  async function decryptBackupWithPin(backupObj, pin) {
    if (!backupObj || !backupObj.salt || !backupObj.payload) {
      throw new Error('Неверный формат зашифрованной копии');
    }
    const salt = base64ToBytes(backupObj.salt);
    const key = await deriveAesKey(pin, salt);
    return decryptJson(backupObj.payload, key);
  }

  function loadPinMeta() {
    try {
      const raw = localStorage.getItem(LOCK_META_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.enabled ? parsed : null;
    } catch {
      return null;
    }
  }

  function savePinMeta(meta) {
    if (!meta) {
      localStorage.removeItem(LOCK_META_KEY);
    } else {
      localStorage.setItem(LOCK_META_KEY, JSON.stringify(meta));
    }
  }

  // Защита от перебора PIN: после 5 ошибок подряд нарастающая пауза
  function getBackoffState() {
    try {
      const raw = localStorage.getItem(BACKOFF_KEY);
      if (!raw) return { fails: 0, lockUntil: 0 };
      const p = JSON.parse(raw);
      return { fails: Number(p.fails) || 0, lockUntil: Number(p.lockUntil) || 0 };
    } catch {
      return { fails: 0, lockUntil: 0 };
    }
  }

  function recordFailedAttempt() {
    const cur = getBackoffState();
    const fails = cur.fails + 1;
    let lockSec = 0;
    if (fails >= 10) lockSec = 300;
    else if (fails >= 7) lockSec = 120;
    else if (fails >= 5) lockSec = 30;
    const lockUntil = lockSec > 0 ? Date.now() + lockSec * 1000 : 0;
    localStorage.setItem(BACKOFF_KEY, JSON.stringify({ fails, lockUntil }));
    return { fails, lockUntil, lockSec };
  }

  function resetFailedAttempts() {
    localStorage.removeItem(BACKOFF_KEY);
  }

  global.HelpCrypto = {
    hasWebCrypto,
    createPinBundle,
    verifyPin,
    encryptJson,
    decryptJson,
    encryptBackupWithPin,
    decryptBackupWithPin,
    loadPinMeta,
    savePinMeta,
    getBackoffState,
    recordFailedAttempt,
    resetFailedAttempts,
  };
})(window);
