# 🚩 CTF Challenge Writeup: The Cursed Barrier Terminal

* **Category:** 🌐 Web
* **Difficulty:** Easy
* **Theme:** Jujutsu Kaisen
* **Flag Format:** `TriHack26{...}`

---

## 📜 Challenge Description

> Satoru Gojo locked the higher-ups out of the Cursed Tool vault using a custom barrier interface. To retrieve the Special Grade Cursed Tool, sorcerers must authenticate with **Special Grade** privileges.
>
> Can you bypass the barrier access control and retrieve the artifact?

---

## 🔍 Vulnerability Analysis

Upon visiting the web application, the portal displays the current user's rank as `GRADE_4` and denies access to the vault.

1. **Cookie Inspection:** 
   Opening Browser Developer Tools (`F12`) $\rightarrow$ **Application / Storage** $\rightarrow$ **Cookies** reveals a cookie named `sorcerer_session`.
2. **Decoding Payload:**
   The cookie value is a Base64 string:
   ```text
   eyJ1c2VybmFtZSI6ICJzb3JjZXJlcl9hcHByZW50aWNlIiwgInJhbmsiOiAiZ3JhZGVfNCIsICJpc19hZG1pbiI6IGZhbHNlfQ==