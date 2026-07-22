#!/usr/bin/env node
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const siteRequire = createRequire("/Users/aklo/projects/newsphere/site/package.json");
const cliRequire = createRequire("/Users/aklo/projects/newsphere/cli/package.json");
const React = siteRequire("react");
const ReactDOMServer = siteRequire("react-dom/server");
const sharp = cliRequire("sharp");

const ROOT = "/Users/aklo/projects/newsphere/cli";
const OUT = path.join(ROOT, "output/pvpicks/gfx/react-4k-2026-04-29");
const HTML_OUT = path.join(OUT, "html");
const BG_OUT = path.join(OUT, "backgrounds");
const ASSETS = path.join(ROOT, "output/pvpicks/gfx/drafts-2026-04-29-v2/assets");

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(HTML_OUT, { recursive: true });

const BASE_W = 1376;
const BASE_H = 768;
const SCALE = 4;
const W = BASE_W * SCALE;
const H = BASE_H * SCALE;

const GREEN = "#00bf91";
const BLACK = "#0f0f10";
const BG = "#f6f8f8";

const files = {
  titling: "/Users/aklo/Library/Fonts/TitlingGothicFBWide-Black-AF65ddb1364d268.otf",
  inter: "/Users/aklo/Library/Fonts/Inter-VariableFont_opsz,wght.ttf",
  logo: path.join(ASSETS, "pvp-logo-official-green.png"),
  bg02: path.join(BG_OUT, "bg-02-make-picks-4k.png"),
  bg03: path.join(BG_OUT, "bg-03-first-pick-4k.png"),
  bg04: path.join(BG_OUT, "bg-04-own-edge-4k.png"),
  bg05: path.join(BG_OUT, "bg-05-edge-every-day-4k.png"),
};

function dataUrl(file, mime) {
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

function fileUrl(file) {
  return pathToFileURL(file).href;
}

const asset = {
  logo: dataUrl(files.logo, "image/png"),
};

const fontCss = `
@font-face {
  font-family: "TitlingGothic";
  src: url("${dataUrl(files.titling, "font/otf")}") format("opentype");
  font-weight: 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "Inter";
  src: url("${dataUrl(files.inter, "font/ttf")}") format("truetype");
  font-weight: 100 900;
  font-style: normal;
  font-display: block;
}
`;

const sx = (n) => Math.round(n * SCALE);

function frameStyle(x, y, w, h) {
  return {
    position: "absolute",
    left: sx(x),
    top: sx(y),
    width: sx(w),
    height: sx(h),
  };
}

function Background({ file }) {
  return React.createElement("img", {
    className: "background",
    src: fileUrl(file),
    alt: "",
  });
}

function Logo({ x, y, w }) {
  return React.createElement("img", {
    src: asset.logo,
    className: "logo",
    alt: "PvP",
    style: {
      position: "absolute",
      left: sx(x),
      top: sx(y),
      width: sx(w),
      height: "auto",
    },
  });
}

function TextBlock({
  lines,
  x,
  y,
  w,
  h,
  size,
  gap = 6,
  align = "left",
  lineHeight = 0.9,
  valign = "center",
}) {
  const justifyContent =
    valign === "end" ? "flex-end" : valign === "start" ? "flex-start" : "center";
  return React.createElement(
    "div",
    {
      className: "text-block",
      style: {
        ...frameStyle(x, y, w, h),
        display: "flex",
        flexDirection: "column",
        justifyContent,
        alignItems: align === "center" ? "center" : "flex-start",
        gap: sx(gap),
        textAlign: align,
        fontSize: sx(size),
        lineHeight,
      },
    },
    lines.map((line, i) =>
      React.createElement(
        "div",
        {
          key: `${line.text}-${i}`,
          className: "headline-line",
          style: {
            color: line.green ? GREEN : BLACK,
            fontSize: line.size ? sx(line.size) : undefined,
            marginBottom: line.gapAfter ? sx(line.gapAfter) : undefined,
            whiteSpace: "nowrap",
          },
        },
        line.text,
      ),
    ),
  );
}

function Button({ x, y, w, h }) {
  return React.createElement(
    "div",
    {
      className: "cta",
      style: {
        ...frameStyle(x, y, w, h),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      },
    },
    React.createElement("div", null, "PLAY NOW"),
    React.createElement("div", null, "PVPICKS.GG"),
  );
}

function Artboard({ children }) {
  return React.createElement("main", { className: "artboard" }, children);
}

const cards = [
  {
    id: "01-best-players",
    component: React.createElement(
      Artboard,
      null,
      React.createElement(Logo, { x: 607, y: 48, w: 162 }),
      React.createElement(TextBlock, {
        x: 68,
        y: 219,
        w: 1240,
        h: 330,
        size: 84,
        gap: 9,
        align: "center",
        lines: [
          { text: "THE BEST PLAYERS" },
          { text: "DON'T JUST CHAT." },
          { text: "THEY COMPETE", green: true },
        ],
      }),
      React.createElement(Button, { x: 578, y: 615, w: 220, h: 72 }),
    ),
  },
  {
    id: "02-make-picks",
    requires: files.bg02,
    component: React.createElement(
      Artboard,
      null,
      React.createElement(Background, { file: files.bg02 }),
      React.createElement(Logo, { x: 74, y: 74, w: 110 }),
      React.createElement(TextBlock, {
        x: 72,
        y: 212,
        w: 780,
        h: 344,
        size: 44,
        gap: 14,
        align: "left",
        lineHeight: 0.94,
        lines: [
          { text: "MAKE YOUR PICKS." },
          { text: "WIN DAILY." },
          { text: "COMPETE EVERY DAY.", green: true },
        ],
      }),
    ),
  },
  {
    id: "03-first-pick",
    requires: files.bg03,
    component: React.createElement(
      Artboard,
      null,
      React.createElement(Background, { file: files.bg03 }),
      React.createElement(Logo, { x: 1138, y: 76, w: 124 }),
      React.createElement(TextBlock, {
        x: 600,
        y: 172,
        w: 720,
        h: 460,
        size: 54,
        gap: 12,
        align: "left",
        lineHeight: 0.92,
        lines: [
          { text: "YOUR PICKS", green: true },
          { text: "BUILD YOUR EDGE", size: 48, gapAfter: 26 },
          { text: "MAKE YOUR", size: 64 },
          { text: "FIRST PICK", size: 72 },
        ],
      }),
    ),
  },
  {
    id: "04-own-edge",
    requires: files.bg04,
    component: React.createElement(
      Artboard,
      null,
      React.createElement(Background, { file: files.bg04 }),
      React.createElement(Logo, { x: 1138, y: 76, w: 124 }),
      React.createElement(TextBlock, {
        x: 600,
        y: 172,
        w: 720,
        h: 460,
        size: 54,
        gap: 12,
        align: "left",
        lineHeight: 0.92,
        lines: [
          { text: "YOUR PICKS", green: true, gapAfter: 26 },
          { text: "BUILD YOUR", size: 64 },
          { text: "OWN EDGE", size: 72 },
        ],
      }),
    ),
  },
  {
    id: "05-edge-every-day",
    requires: files.bg05,
    component: React.createElement(
      Artboard,
      null,
      React.createElement(Background, { file: files.bg05 }),
      React.createElement(Logo, { x: 72, y: 64, w: 116 }),
      React.createElement(TextBlock, {
        x: 72,
        y: 224,
        w: 540,
        h: 320,
        size: 62,
        gap: 4,
        align: "left",
        lineHeight: 0.9,
        lines: [
          { text: "YOUR EDGE", gapAfter: 34 },
          { text: "EVERY", green: true, size: 72 },
          { text: "DAY", green: true, size: 72 },
        ],
      }),
    ),
  },
];

function htmlFor(card) {
  const body = ReactDOMServer.renderToStaticMarkup(card.component);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${W},height=${H},initial-scale=1" />
    <style>
      ${fontCss}
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        background: ${BG};
      }
      .artboard {
        position: relative;
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        background:
          radial-gradient(circle at 18% 88%, rgba(169, 255, 224, 0.16), transparent 28%),
          linear-gradient(135deg, #ffffff 0%, ${BG} 100%);
        color: ${BLACK};
      }
      .background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .headline-line {
        font-family: "TitlingGothic", sans-serif;
        font-weight: 900;
        letter-spacing: 0;
      }
      .logo {
        object-fit: contain;
      }
      .cta {
        background: ${GREEN};
        color: white;
        font-family: "Inter", sans-serif;
        font-size: ${sx(20)}px;
        line-height: 1.05;
        font-weight: 800;
        letter-spacing: 0;
      }
    </style>
  </head>
  <body>${body}</body>
</html>`;
}

const rendered = [];
for (const card of cards) {
  if (card.requires && !fs.existsSync(card.requires)) {
    throw new Error(`Missing required 4K background for ${card.id}: ${card.requires}`);
  }
  const htmlPath = path.join(HTML_OUT, `${card.id}.html`);
  const pngPath = path.join(OUT, `pvpicks-react-4k-${card.id}.png`);
  fs.writeFileSync(htmlPath, htmlFor(card));
  execFileSync(
    "playwright",
    [
      "screenshot",
      "--browser=chromium",
      "--viewport-size",
      `${W},${H}`,
      "--wait-for-selector",
      ".artboard",
      `file://${htmlPath}`,
      pngPath,
    ],
    { stdio: "inherit" },
  );
  rendered.push(pngPath);
}

const thumbs = await Promise.all(
  rendered.map((file) => sharp(file).resize(688, 384).toBuffer()),
);
await sharp({
  create: {
    width: 688,
    height: 384 * thumbs.length,
    channels: 3,
    background: "#ffffff",
  },
})
  .composite(thumbs.map((input, i) => ({ input, top: 384 * i, left: 0 })))
  .png()
  .toFile(path.join(OUT, "pvpicks-react-4k-contact-sheet.png"));

console.log(`Rendered ${cards.length} React/HTML 4K graphics to ${OUT}`);
