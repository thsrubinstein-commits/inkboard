#!/usr/bin/env python3
"""
Run this ONCE on your own computer to generate a long-lived Garmin session token.

    pip install garth
    python scripts/garmin_token.py

It asks for your Garmin email + password (and an MFA code if your account uses MFA),
then prints a base64 token string. Copy that whole string into the GitHub secret
GARMIN_TOKEN_BASE64 so the daily Action can log in without needing your password or MFA.

Nothing is uploaded by this script — it only talks to Garmin and prints to your terminal.
"""

import base64
import getpass

import garth


def main():
    email = input("Garmin email: ").strip()
    password = getpass.getpass("Garmin password: ")
    try:
        garth.login(email, password)
    except Exception:
        # MFA-protected account: garth will prompt for the emailed/app code.
        code = input("MFA code: ").strip()
        garth.login(email, password, prompt_mfa=lambda: code)

    token = garth.client.dumps()
    b64 = base64.b64encode(token.encode("utf-8")).decode("utf-8")
    print("\n=== GARMIN_TOKEN_BASE64 (store this as a GitHub secret) ===\n")
    print(b64)
    print("\n=== end ===")


if __name__ == "__main__":
    main()
