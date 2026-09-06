# EchoFrame --- Product Requirements Document (MVP v1)

> Turn a single photo into an immersive spatial-audio memory.

## Problem

Photos capture visuals, but not the sounds that made the moment
memorable.

Examples: - Hill station → birds, wind, waterfall. - Beach → waves,
seagulls, children laughing. - Temple → bells, chants, footsteps.

**Goal:** Let users recreate the soundscape around a photo using
drag-and-drop spatial audio.

------------------------------------------------------------------------

# Vision

Create a lightweight editor where users can:

1.  Upload one image.
2.  Set video duration.
3.  Drag sounds onto different parts of the image.
4.  Hear sounds from those directions in headphones.
5.  Export as MP4.

No AI. No animation. Pure manual editor for MVP.

------------------------------------------------------------------------

# MVP Scope

## Phase 1

-   Upload image.
-   Canvas editor.
-   Audio library.
-   Drag audio onto image.
-   Timeline editor.
-   Trim audio.
-   Loop audio.
-   Volume slider.
-   Spatial positioning.
-   Export MP4.

------------------------------------------------------------------------

# User Flow

1.  Upload image.
2.  Default duration: 10 sec.
3.  Resize duration.
4.  Drag sound from library.
5.  Position on image.
6.  Preview.
7.  Export.

------------------------------------------------------------------------

# Core Features

## Image Canvas

-   Single image only.
-   Zoom.
-   Pan.
-   Fit.
-   Lock image.

### Canvas Behaviour

-   Image stays fixed.
-   Sounds move independently.

Reference: - Canva image editor. - VN Editor preview canvas.

------------------------------------------------------------------------

## Sound Library

Built-in categories.

### Nature

-   Birds
-   Wind
-   Rain
-   Waterfall
-   River

### City

-   Traffic
-   Crowd
-   Metro

### Temple

-   Bell
-   Chanting

### People

-   Laugh
-   Clap
-   Footsteps

### Objects

-   Fire
-   Camera
-   Door

Audio format:

-   mp3
-   wav

------------------------------------------------------------------------

## Drag and Drop

Interaction inspired by:

-   CapCut
-   VN Editor

Behaviour:

-   Drag sound icon.
-   Drop anywhere.
-   Select sound.
-   Move again.
-   Delete.

Each sound becomes an independent layer.

------------------------------------------------------------------------

## Timeline

CapCut / VN style.

Each sound has:

-   Start.
-   End.
-   Trim.
-   Split.
-   Loop.
-   Fade In.
-   Fade Out.

Timeline supports multiple tracks.

------------------------------------------------------------------------

## Sound Properties Panel

Every selected sound contains:

### Basic

-   Name
-   Duration
-   Volume
-   Mute
-   Delete

### Spatial

-   X Position
-   Y Position
-   Distance

### Playback

-   Loop
-   Fade In
-   Fade Out

------------------------------------------------------------------------

# Spatial Audio System

Use native **Web Audio API**.

Technology:

-   AudioContext
-   AudioListener
-   PannerNode

Position mapping:

  Image    Spatial
  -------- ---------
  Left     x=-5
  Right    x=5
  Top      y=3
  Bottom   y=-3
  Center   x=0 y=0

Distance slider controls z-axis.

------------------------------------------------------------------------

# Data Model

``` ts
Project {
  id
  name
  duration
  image
  sounds[]
}

SoundLayer {
  id
  file
  x
  y
  z
  start
  end
  volume
  loop
  fadeIn
  fadeOut
}
```

------------------------------------------------------------------------

# Export Pipeline

1.  Render image.
2.  Render spatial audio.
3.  Merge with FFmpeg.
4.  Export MP4.

Output:

-   Stereo binaural audio.
-   Works best with headphones.

------------------------------------------------------------------------

# UI Design

## Theme

Minimal dark.

### Colors

  Token        Value
  ------------ ---------
  Background   #111827
  Surface      #1F2937
  Accent       #22C55E
  Border       #374151
  Secondary    #9CA3AF

### Style

-   Rounded cards.
-   Soft shadows.
-   Thin borders.
-   Large spacing.

No gradients.

------------------------------------------------------------------------

# Typography

## Google Fonts

### Headings

Space Grotesk

### Body

Manrope

### Timeline / Labels

Inter

Rules:

-   No italic.
-   Medium weight.
-   Bold only for headings.

------------------------------------------------------------------------

# Layout

## Left Sidebar

-   Upload
-   Sound Library
-   Search

## Center

Image Canvas

## Right Sidebar

Sound Properties

## Bottom

Timeline

------------------------------------------------------------------------

# Components

## Top Toolbar

-   Undo
-   Redo
-   Play
-   Pause
-   Export

## Canvas

-   Draggable sound pins.
-   Selected pin highlight.

## Timeline

-   Playhead.
-   Zoom timeline.
-   Tracks.

------------------------------------------------------------------------

# Interaction Rules

## Add Sound

Drag from sidebar.

## Move Sound

Drag pin.

Update x/y instantly.

## Trim

Drag clip edges.

## Split

Shortcut:

Ctrl + B

## Delete

Delete key.

------------------------------------------------------------------------

# Folder Structure

``` text
src/
  components/
  canvas/
  timeline/
  audio/
  hooks/
  utils/
  pages/

assets/
  sounds/
  icons/
```

------------------------------------------------------------------------

# Libraries

## Required

-   React
-   Next.js
-   TypeScript
-   React Konva
-   Wavesurfer.js
-   Web Audio API

## Backend

-   FastAPI
-   FFmpeg

------------------------------------------------------------------------

# References

## Timeline UX

CapCut

## Canvas UX

Canva

## Audio Editing

VN Editor

## Spatial Audio

Apple Spatial Audio

------------------------------------------------------------------------

# Phase Plan

## Phase 1

Manual editor.

## Phase 2

AI sound suggestions.

## Phase 3

Moving sound paths.

## Phase 4

Parallax image animation.

## Phase 5

Voice memories and collaboration.

------------------------------------------------------------------------

# Success Criteria

A user can upload one photo, place multiple sounds around it, preview
the scene using headphones with directional audio, and export a
shareable MP4 that recreates the memory.
