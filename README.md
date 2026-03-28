# Commander Matchmaker Clean v2

This is the clean, no-cache version for GitHub Pages.

---

## Overview

Commander Matchmaker is a lightweight tool for generating **balanced Commander pods and fair 1v1 matchups**.

It uses a structured system based on:

* Power
* Game Speed
* Threat Perception

---

## Core System

### Power

Overall deck strength (1–10 scale)

### Game Speed

* Slow
* Medium
* Fast

### Threat Perception

* Low
* Medium
* High
* Very High

---

## Pod Builder

Generates balanced 4-player pods using:

* Power range filtering
* Optional speed filtering
* Threat balancing
* Max High Threat cap
* Randomized selection with reroll

---

## 1v1 Generator

Creates fair matchups using:

* Power range filtering
* Optional speed filtering
* Threat filtering
* Threat mismatch prevention

---

## Deck Types

* Precon
* Homebrew
* Upgraded Precon

---

## Important

This version intentionally does **not** include a service worker.
That means updates to `decks.json` and the data model will appear without cache issues.

---

## Data

The repository includes:

* `commander_sheet_v18_1v1_threat_fixed.xlsx`
* `decks.json`

These drive the matchmaking logic.

---

## Deploy to GitHub Pages

1. Create a new public repo (or use this one)
2. Upload all files to the repo root
3. In GitHub: Settings → Pages
4. Source: Deploy from a branch
5. Branch: `main`
6. Folder: `/ (root)`
7. Save

---

## iPhone

Open the GitHub Pages URL in Safari, then:
Share → Add to Home Screen

---

## Version

v18

* Added Game Speed and Threat Perception
* Rebuilt Pod Builder with threat balancing
* Rebuilt 1v1 Generator with mismatch prevention
* Standardized Deck Type (removed Source)
* Fixed multi-deck pod generation
* Fixed threat lookup logic

---
