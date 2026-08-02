import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { SlateMark } from './Icons';
const prefersReducedMotion = () => typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SNIPPET = [
    '# Sourdough, take four',
    'Crumb was **almost** right. Less water next time.',
    '',
    '- [x] Feed the starter',
    '- [ ] Bulk rise, 5h',
    '- [ ] Bake at 250°C',
    '',
    '#recipes #baking',
].join('\n');
/** Types the snippet character by character, holds it, then starts over. */
function useTypewriter(text) {
    const [length, setLength] = useState(0);
    useEffect(() => {
        if (prefersReducedMotion()) {
            setLength(text.length);
            return;
        }
        let index = 0;
        let timer = 0;
        const step = () => {
            index += 1;
            setLength(index);
            if (index >= text.length) {
                timer = window.setTimeout(() => {
                    index = 0;
                    setLength(0);
                    timer = window.setTimeout(step, 900);
                }, 6000);
                return;
            }
            const delay = text[index - 1] === '\n' ? 400 : 24 + Math.random() * 44;
            timer = window.setTimeout(step, delay);
        };
        timer = window.setTimeout(step, 800);
        return () => window.clearTimeout(timer);
    }, [text]);
    return text.slice(0, length);
}
const SLATE_WORDS = [
    'half-baked ideas',
    'grocery lists',
    '3am epiphanies',
    'plot twists',
    'grand plans',
    'sourdough notes',
];
/** Cycles the headline's last word so the hero never sits perfectly still. */
function useRotatingWord(words) {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        if (prefersReducedMotion())
            return;
        const timer = window.setInterval(() => {
            setIndex((value) => (value + 1) % words.length);
        }, 2400);
        return () => window.clearInterval(timer);
    }, [words]);
    return index;
}
/** Renders typed text the way the editor does: **bold** and #tags get live styling. */
function inlineNodes(text, keyBase) {
    const nodes = [];
    let bold = false;
    text.split('**').forEach((segment, segmentIndex) => {
        if (segment) {
            const tagPattern = /(^|\s)(#[\p{L}\p{N}_/-]+)/gu;
            let last = 0;
            let match;
            let part = 0;
            const pushText = (value) => {
                if (!value)
                    return;
                nodes.push(bold ? _jsx("strong", { children: value }, `${keyBase}-${segmentIndex}-${part++}`) : value);
            };
            while ((match = tagPattern.exec(segment))) {
                pushText(segment.slice(last, match.index) + match[1]);
                nodes.push(_jsx("span", { className: "mock-tag", children: match[2] }, `${keyBase}-tag-${segmentIndex}-${part++}`));
                last = match.index + match[0].length;
            }
            pushText(segment.slice(last));
        }
        bold = !bold;
    });
    return nodes;
}
function MockEditorText({ text }) {
    const lines = text.split('\n');
    return (_jsx(_Fragment, { children: lines.map((line, index) => {
            const caret = index === lines.length - 1 ? _jsx("span", { className: "mock-caret" }) : null;
            if (line.startsWith('# ')) {
                return (_jsxs("div", { className: "mock-h1", children: [inlineNodes(line.slice(2), `h${index}`), caret] }, index));
            }
            const todo = /^- \[([ x])\] ?(.*)$/.exec(line);
            if (todo) {
                return (_jsxs("div", { className: "mock-line mock-todo", children: [_jsx("span", { className: "mock-box", "data-checked": todo[1] === 'x', children: todo[1] === 'x' ? '✓' : '' }), _jsxs("span", { children: [inlineNodes(todo[2], `t${index}`), caret] })] }, index));
            }
            return (_jsxs("div", { className: "mock-line", children: [inlineNodes(line, `l${index}`), caret] }, index));
        }) }));
}
const LIST_NOTES = [
    { title: 'Sourdough, take four', meta: 'Just now', width: '82%', active: true },
    { title: 'Reading list', meta: 'Tuesday', width: '64%', active: false },
    { title: 'Weekly review', meta: 'Sunday', width: '74%', active: false },
    { title: 'Trip packing', meta: 'Mar 14', width: '58%', active: false },
    { title: 'Book notes — Piranesi', meta: 'Mar 9', width: '71%', active: false },
];
/** Crosshair plus-marks pinned to the four corners of a blueprint frame. */
function CornerMarks() {
    return (_jsxs("span", { className: "lp-marks", "aria-hidden": "true", children: [_jsx("i", {}), " ", _jsx("i", {}), " ", _jsx("i", {}), " ", _jsx("i", {})] }));
}
/** Thin wireframe orbit sphere — the "everything is connected" illustration. */
function OrbitSphere({ className }) {
    return (_jsxs("svg", { className: className, viewBox: "0 0 120 120", fill: "none", "aria-hidden": "true", children: [_jsx("circle", { cx: "60", cy: "60", r: "42", stroke: "currentColor", strokeWidth: "1.4" }), _jsx("ellipse", { cx: "60", cy: "60", rx: "56", ry: "18", stroke: "currentColor", strokeWidth: "1", strokeDasharray: "4 4" }), _jsx("ellipse", { cx: "60", cy: "60", rx: "18", ry: "56", stroke: "currentColor", strokeWidth: "1", strokeDasharray: "4 4" }), _jsx("circle", { cx: "60", cy: "18", r: "3", fill: "currentColor" }), _jsx("circle", { cx: "104", cy: "72", r: "3", fill: "currentColor" }), _jsx("circle", { cx: "22", cy: "86", r: "3", fill: "currentColor" }), _jsx("line", { x1: "60", y1: "18", x2: "104", y2: "72", stroke: "currentColor", strokeWidth: "0.8", strokeDasharray: "2 3" }), _jsx("line", { x1: "60", y1: "18", x2: "22", y2: "86", stroke: "currentColor", strokeWidth: "0.8", strokeDasharray: "2 3" })] }));
}
/** A miniature of the real two-pane app, typing a note to itself. */
function MockWindow() {
    const typed = useTypewriter(SNIPPET);
    return (_jsxs("div", { className: "lp-stage", "aria-hidden": "true", children: [_jsx("span", { className: "lp-fig", children: "FIG.01 \u2014 the whole app, actual size" }), _jsxs("div", { className: "mock-window", children: [_jsxs("div", { className: "mock-titlebar", children: [_jsx("span", { className: "mock-dot", "data-tone": "one" }), _jsx("span", { className: "mock-dot", "data-tone": "two" }), _jsx("span", { className: "mock-dot", "data-tone": "three" }), _jsx("span", { className: "mock-titlebar-title", children: "~/notes/sourdough-take-four.md" })] }), _jsxs("div", { className: "mock-body", children: [_jsxs("div", { className: "mock-list", children: [_jsxs("span", { className: "mock-list-brand", children: [_jsx(SlateMark, { size: 12 }), "Slate"] }), _jsx("span", { className: "mock-search" }), LIST_NOTES.map((note) => (_jsxs("span", { className: "mock-note", "data-active": note.active, children: [_jsx("span", { className: "mock-note-title", children: note.title }), _jsx("span", { className: "mock-note-line", style: { width: note.width } }), _jsx("span", { className: "mock-note-meta", children: note.meta })] }, note.title)))] }), _jsx("div", { className: "mock-editor", children: _jsx(MockEditorText, { text: typed }) })] })] }), _jsxs("span", { className: "lp-pin lp-pin-sync", children: [_jsx("span", { className: "lp-pin-dot" }), "SYNC://OK"] }), _jsx("span", { className: "lp-leader lp-leader-sync" }), _jsx("span", { className: "lp-pin lp-pin-tag", children: "#recipes \u00B7 6 notes" }), _jsx("span", { className: "lp-leader lp-leader-tag" }), _jsxs("span", { className: "lp-note-hand", children: ["0 folders required", _jsx("svg", { viewBox: "0 0 40 28", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M36 4C26 2 12 4 6 20m0 0 6-4m-6 4-4-5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), _jsx("span", { className: "lp-pixel lp-pixel-a" }), _jsx("span", { className: "lp-pixel lp-pixel-b" }), _jsx(OrbitSphere, { className: "lp-orbit" })] }));
}
const MARQUEE = [
    'plain text forever',
    'markdown native',
    'tags beat folders',
    'keyboard first',
    'no lock-in',
    'export anytime',
];
const CHEATS = [
    { raw: '# Big idea', render: _jsx("span", { className: "lp-cheat-h1", children: "Big idea" }) },
    { raw: '**important**', render: _jsx("strong", { children: "important" }) },
    {
        raw: '- [ ] milk',
        render: (_jsxs("span", { className: "lp-cheat-todo", children: [_jsx("span", { className: "lp-cheat-box" }), "milk"] })),
    },
    { raw: '#recipes', render: _jsx("span", { className: "lp-cheat-pill", children: "#recipes" }) },
];
const FEATURES = [
    {
        index: '01',
        title: 'Markdown that shows its work',
        body: 'Headings swell, todos sprout checkboxes, tables snap into a grid — all while the file underneath stays boring, portable text.',
    },
    {
        index: '02',
        title: 'Tags, not folders',
        body: 'Drop a #tag mid-sentence. Nest them like folders if you must — one note can live in six places at once.',
    },
    {
        index: '03',
        title: 'Follows you around',
        body: 'Sign in once and every note turns up on the next device, mid-sentence.',
    },
    {
        index: '04',
        title: 'Yours to walk away with',
        body: 'Every note exports as a plain .md file. No hostage situation, no export fee — just a folder of text you can read in thirty years.',
    },
];
export function LandingScreen({ onLaunch }) {
    const wordIndex = useRotatingWord(SLATE_WORDS);
    return (_jsxs("div", { className: "lp", children: [_jsxs("header", { className: "lp-nav", children: [_jsxs("a", { className: "lp-logo", href: "#top", children: [_jsx("span", { className: "lp-logo-mark", children: _jsx(SlateMark, { size: 20 }) }), _jsx("span", { className: "lp-logo-word", children: "Slate" })] }), _jsxs("nav", { className: "lp-nav-links", "aria-label": "Sections", children: [_jsx("a", { href: "#syntax", children: "Syntax" }), _jsx("a", { href: "#features", children: "Features" })] }), _jsxs("div", { className: "lp-nav-actions", children: [_jsx("button", { type: "button", className: "lp-link", onClick: () => onLaunch('signIn'), children: "Sign in" }), _jsx("button", { type: "button", className: "lp-btn lp-btn-solid lp-btn-sm", onClick: () => onLaunch('signUp'), children: _jsx("span", { children: "Get started" }) })] })] }), _jsxs("main", { className: "lp-main", id: "top", children: [_jsxs("section", { className: "lp-hero", children: [_jsxs("div", { className: "lp-hero-copy", children: [_jsx("span", { className: "lp-eyebrow lp-pop", style: { animationDelay: '40ms' }, children: "[ markdown notes with a pulse ]" }), _jsxs("h1", { className: "lp-title lp-pop", style: { animationDelay: '110ms' }, children: [_jsx("span", { className: "lp-title-line", children: "A clean slate for your" }), _jsx("span", { className: "lp-rotor", children: SLATE_WORDS.map((word, index) => (_jsx("span", { className: "lp-rotor-word", "data-active": index === wordIndex, "aria-hidden": index === wordIndex ? undefined : true, children: word }, word))) })] }), _jsx("p", { className: "lp-lede lp-pop", style: { animationDelay: '190ms' }, children: "Slate is a fast little markdown notebook that doesn't nag, sync-spin, or hide your words behind a database. Type. Tag. Close the laptop. It'll all still be there." }), _jsxs("div", { className: "lp-cta-group lp-pop", style: { animationDelay: '260ms' }, children: [_jsx("button", { type: "button", className: "lp-btn lp-btn-notch lp-btn-lg", onClick: () => onLaunch('signUp'), children: _jsx("span", { children: "Start writing \u2014 free\u00A0\u2192" }) }), _jsx("button", { type: "button", className: "lp-btn lp-btn-slate lp-btn-lg", onClick: () => onLaunch('signIn'), children: _jsx("span", { children: "I've been here before" }) })] }), _jsxs("ul", { className: "lp-ticks lp-pop", style: { animationDelay: '330ms' }, children: [_jsx("li", { children: "no credit card" }), _jsx("li", { children: "no onboarding tour" }), _jsx("li", { children: "no folders, ever" })] })] }), _jsx("div", { className: "lp-hero-shot lp-pop", style: { animationDelay: '400ms' }, children: _jsx(MockWindow, {}) })] }), _jsx("div", { className: "lp-marquee", "aria-hidden": "true", children: _jsx("div", { className: "lp-marquee-track", children: [0, 1].map((copy) => (_jsx("div", { className: "lp-marquee-group", children: MARQUEE.map((item) => (_jsxs("span", { className: "lp-marquee-item", children: [item, _jsx("i", { children: "+" })] }, item))) }, copy))) }) }), _jsxs("section", { className: "lp-section", id: "syntax", children: [_jsxs("div", { className: "lp-section-head", children: [_jsx("span", { className: "lp-eyebrow", children: "[ syntax \u2192 render ]" }), _jsx("h2", { className: "lp-h2", children: "Type this, get that" }), _jsx("p", { className: "lp-section-sub", children: "Type the markdown you already half-remember \u2014 headings, todos, and tags light up as you go." })] }), _jsxs("div", { className: "lp-grid-frame lp-cheat-grid", children: [_jsx(CornerMarks, {}), CHEATS.map((cheat, index) => (_jsxs("div", { className: "lp-cheat", children: [_jsxs("span", { className: "lp-cell-index", children: ["ex.", String(index + 1).padStart(2, '0')] }), _jsx("code", { className: "lp-cheat-raw", children: cheat.raw }), _jsx("span", { className: "lp-cheat-arrow", "aria-hidden": "true", children: "->" }), _jsx("span", { className: "lp-cheat-out", children: cheat.render })] }, cheat.raw)))] })] }), _jsxs("section", { className: "lp-dark", id: "features", children: [_jsx("span", { className: "lp-pill", children: "Learn more" }), _jsxs("div", { className: "lp-dark-inner", children: [_jsxs("div", { className: "lp-section-head", children: [_jsx("span", { className: "lp-eyebrow lp-eyebrow-sea", children: "[ the spec sheet ]" }), _jsx("h2", { className: "lp-h2 lp-h2-dark", children: "Four things, done properly" }), _jsx("p", { className: "lp-section-sub lp-sub-dark", children: "Instead of forty things done in a settings panel nobody opens." })] }), _jsxs("div", { className: "lp-grid-frame lp-feat-grid", children: [_jsx(CornerMarks, {}), FEATURES.map((feature) => (_jsxs("article", { className: "lp-feature", children: [_jsx("span", { className: "lp-feat-index", children: feature.index }), _jsx("h3", { className: "lp-h3", children: feature.title }), _jsx("p", { className: "lp-feature-body", children: feature.body })] }, feature.index)))] })] }), _jsx("span", { className: "lp-pixel lp-pixel-c" }), _jsx("span", { className: "lp-pixel lp-pixel-d" }), _jsx(OrbitSphere, { className: "lp-orbit-dark" }), _jsx("div", { className: "lp-tear", "aria-hidden": "true" })] }), _jsx("section", { className: "lp-closer", children: _jsxs("div", { className: "lp-closer-inner lp-frame-corners", children: [_jsx(CornerMarks, {}), _jsx("span", { className: "lp-eyebrow", children: "[ step 01 \u2014 open a note ]" }), _jsx("h2", { className: "lp-closer-title", children: "Go on, write something down." }), _jsx("p", { className: "lp-closer-sub", children: "It takes about nine seconds to make an account, and roughly zero to start typing." }), _jsxs("div", { className: "lp-cta-group lp-cta-center", children: [_jsx("button", { type: "button", className: "lp-btn lp-btn-notch lp-btn-lg", onClick: () => onLaunch('signUp'), children: _jsx("span", { children: "Open a blank note\u00A0\u2192" }) }), _jsx("button", { type: "button", className: "lp-btn lp-btn-outline lp-btn-lg", onClick: () => onLaunch('signIn'), children: _jsx("span", { children: "Sign in" }) })] })] }) })] }), _jsxs("footer", { className: "lp-foot", children: [_jsxs("div", { className: "lp-foot-row", children: [_jsxs("span", { className: "lp-foot-brand", children: [_jsx(SlateMark, { size: 16 }), "Slate \u2014 v0.1.0"] }), _jsx("span", { children: "Built for people who think in plain text." }), _jsx("button", { type: "button", className: "lp-link", onClick: () => onLaunch('signUp'), children: "Get started \u2192" })] }), _jsx("span", { className: "lp-foot-giant", "aria-hidden": "true", children: "Slate" })] })] }));
}
