#!/usr/bin/env python3
"""Clean test data from Firestore, keep fm_users + fm_meta/seeded."""
import json, urllib.request

KEY = "AIzaSyBK5_divrm4f7RD64ed0hpet5W9Z8lnG5c"
PROJ = "academic-fath-portal"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJ}/databases/(default)/documents"

def list_docs(col):
    url = f"{BASE}/{col}?pageSize=200&key={KEY}"
    with urllib.request.urlopen(url) as r:
        return [d["name"] for d in json.load(r).get("documents", [])]

def delete_doc(name):
    url = f"https://firestore.googleapis.com/v1/{name}?key={KEY}"
    req = urllib.request.Request(url, method="DELETE")
    with urllib.request.urlopen(req) as r:
        return r.status

total = 0
for col in ["fm_posts", "fm_stories", "fm_messages", "fm_notifications", "fm_files"]:
    names = list_docs(col)
    for n in names:
        delete_doc(n)
    print(f"{col}: deleted {len(names)}")
    total += len(names)

# verify users intact
users = list_docs("fm_users")
print(f"fm_users kept: {len(users)}")
print(f"TOTAL DELETED: {total}")
