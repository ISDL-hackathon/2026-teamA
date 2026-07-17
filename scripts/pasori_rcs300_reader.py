#!/usr/bin/env python3
"""Read FeliCa IDm with PaSoRi RC-S300 and send scans to Rails."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request

try:
    from smartcard.CardConnection import CardConnection
    from smartcard.Exceptions import CardConnectionException, NoCardException
    from smartcard.System import readers
except ImportError:
    print("pyscard is required. Install it with: py -m pip install pyscard", file=sys.stderr)
    raise SystemExit(1)


API_URL = os.getenv("ROOM_PORTAL_SCAN_URL", "http://127.0.0.1:3000/api/v1/scan")
API_KEY = os.getenv("API_KEY", "")
POLL_INTERVAL_SECONDS = float(os.getenv("PASORI_POLL_INTERVAL", "0.5"))
COOLDOWN_SECONDS = float(os.getenv("PASORI_SCAN_COOLDOWN", "8"))


def log(message: str, *, error: bool = False) -> None:
    print(message, file=sys.stderr if error else sys.stdout, flush=True)


def main() -> int:
    reader = find_reader()
    log(f"Using reader: {reader}")
    log(f"Posting scans to: {API_URL}")
    log("Waiting for card scans...")

    last_idm = None
    last_scan_at = 0.0

    while True:
        try:
            idm = read_idm(reader)
        except NoCardException:
            time.sleep(POLL_INTERVAL_SECONDS)
            continue
        except CardConnectionException as error:
            print(f"reader error: {error}", file=sys.stderr)
            time.sleep(1)
            continue

        now = time.monotonic()
        if idm == last_idm and now - last_scan_at < COOLDOWN_SECONDS:
            time.sleep(POLL_INTERVAL_SECONDS)
            continue

        last_idm = idm
        last_scan_at = now
        log(f"card read: {idm}")
        post_scan(idm)
        time.sleep(POLL_INTERVAL_SECONDS)


def find_reader():
    available_readers = readers()
    if not available_readers:
        log("No PC/SC reader found. Connect RC-S300 and install the Sony NFC Port Software.", error=True)
        raise SystemExit(1)

    for reader in available_readers:
        if "RC-S300" in str(reader) or "PaSoRi" in str(reader) or "Sony" in str(reader):
            return reader

    return available_readers[0]


def read_idm(reader) -> str:
    connection = reader.createConnection()
    connection.connect(CardConnection.T0_protocol | CardConnection.T1_protocol)

    # PC/SC GET DATA. For FeliCa cards this returns the 8-byte IDm on RC-S300.
    data, sw1, sw2 = connection.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
    if (sw1, sw2) == (0x69, 0x85):
        raise NoCardException("no card is ready to read")
    if (sw1, sw2) != (0x90, 0x00):
        raise CardConnectionException(f"failed to read IDm: SW={sw1:02X}{sw2:02X}")

    return bytes(data).hex().upper()


def post_scan(idm: str) -> None:
    body = json.dumps({"idm": idm}).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"

    request = urllib.request.Request(API_URL, data=body, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            payload = json.loads(response.read().decode("utf-8"))
            log(f"{payload['timestamp']} {payload['user_name']} {payload['action']} ({idm})")
    except urllib.error.HTTPError as error:
        message = error.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(message)
        except json.JSONDecodeError:
            payload = {}
        if payload.get("code") == "CARD_NOT_FOUND":
            rejected_idm = payload.get("idm", idm)
            log(f"unregistered card: {rejected_idm}. Register this IDm to a user.", error=True)
            return
        log(f"scan rejected for {idm}: HTTP {error.code} {message}", error=True)
    except urllib.error.URLError as error:
        log(f"scan failed for {idm}: {error}", error=True)


if __name__ == "__main__":
    raise SystemExit(main())
