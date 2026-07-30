import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { SlateMark, CheckIcon, ChevronRight, CodeIcon, SyncIcon, TagIcon } from './Icons';
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
];
/** A miniature of the real two-pane app, typing a note to itself. */
function MockWindow() {
    const typed = useTypewriter(SNIPPET);
    return (_jsxs("div", { className: "lp-stage", "aria-hidden": "true", children: [_jsxs("div", { className: "mock-window", children: [_jsxs("div", { className: "mock-titlebar", children: [_jsx("span", { className: "mock-dot", "data-tone": "red" }), _jsx("span", { className: "mock-dot", "data-tone": "yellow" }), _jsx("span", { className: "mock-dot", "data-tone": "green" }), _jsx("span", { className: "mock-titlebar-title", children: "sourdough-take-four.md" })] }), _jsxs("div", { className: "mock-body", children: [_jsxs("div", { className: "mock-list", children: [_jsxs("span", { className: "mock-list-brand", children: [_jsx(SlateMark, { size: 12 }), "Slate"] }), _jsx("span", { className: "mock-search" }), LIST_NOTES.map((note) => (_jsxs("span", { className: "mock-note", "data-active": note.active, children: [_jsx("span", { className: "mock-note-title", children: note.title }), _jsx("span", { className: "mock-note-line", style: { width: note.width } }), _jsx("span", { className: "mock-note-meta", children: note.meta })] }, note.title)))] }), _jsx("div", { className: "mock-editor", children: _jsx(MockEditorText, { text: typed }) })] })] }), _jsxs("span", { className: "lp-sticker lp-sticker-sync", children: [_jsx(CheckIcon, { size: 13 }), "synced, obviously"] }), _jsxs("span", { className: "lp-sticker lp-sticker-tag", children: [_jsx(TagIcon, { size: 13 }), "#recipes \u00B7 6 notes"] }), _jsxs("span", { className: "lp-sticker lp-sticker-zero", children: ["0 folders", _jsx("br", {}), _jsx("small", { children: "required" })] })] }));
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
const CARDS = [
    {
        tone: 'honey',
        icon: CodeIcon,
        kicker: 'the writing bit',
        title: 'Markdown that shows its work',
        body: 'Headings swell, todos sprout checkboxes, tables snap into a grid — all while the file underneath stays boring, portable text.',
        wide: true,
    },
    {
        tone: 'sky',
        icon: TagIcon,
        kicker: 'the filing bit',
        title: 'Tags, not folders',
        body: 'Drop a #tag mid-sentence. Nest them like folders if you must. One note can live in six places at once.',
        wide: false,
    },
    {
        tone: 'mint',
        icon: SyncIcon,
        kicker: 'the everywhere bit',
        title: 'Follows you around',
        body: 'Sign in once and every note turns up on the next device, mid-sentence.',
        wide: false,
    },
    {
        tone: 'grape',
        icon: SlateMark,
        kicker: 'the trust bit',
        title: 'Yours to walk away with',
        body: 'Every note exports as a plain .md file. No hostage situation, no export fee, no hard feelings — just a folder of text you can read in thirty years.',
        wide: true,
    },
];
function Squiggle({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 120 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M2 14c8-14 16 10 24-2s16 12 24 0 16 10 24-2 16 8 22 2", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round" }) }));
}
function Star({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M12 1.5c.6 6 3.9 9.3 9.9 9.9v1.2c-6 .6-9.3 3.9-9.9 9.9h-1.2C10.2 16.5 6.9 13.2.9 12.6v-1.2c6-.6 9.3-3.9 9.9-9.9h1.2Z", fill: "currentColor" }) }));
}
export function LandingScreen({ onLaunch }) {
    const wordIndex = useRotatingWord(SLATE_WORDS);
    return (_jsxs("div", { className: "lp", children: [_jsx("div", { className: "lp-paper", "aria-hidden": "true" }), _jsxs("div", { className: "lp-blobs", "aria-hidden": "true", children: [_jsx("span", { className: "lp-blob lp-blob-a" }), _jsx("span", { className: "lp-blob lp-blob-b" }), _jsx("span", { className: "lp-blob lp-blob-c" })] }), _jsxs("header", { className: "lp-nav", children: [_jsxs("a", { className: "lp-logo", href: "#top", children: [_jsx("span", { className: "lp-logo-mark", children: _jsx(SlateMark, { size: 20 }) }), _jsx("span", { className: "lp-logo-word", children: "Slate" })] }), _jsxs("nav", { className: "lp-nav-actions", children: [_jsx("button", { type: "button", className: "lp-link", onClick: () => onLaunch('signIn'), children: "Sign in" }), _jsx("button", { type: "button", className: "lp-btn lp-btn-primary lp-btn-sm", onClick: () => onLaunch('signUp'), children: "Get started" })] })] }), _jsxs("main", { className: "lp-main", id: "top", children: [_jsxs("section", { className: "lp-hero", children: [_jsxs("div", { className: "lp-hero-copy", children: [_jsxs("span", { className: "lp-badge lp-pop", style: { animationDelay: '40ms' }, children: [_jsx(Star, { className: "lp-badge-star" }), "markdown notes with a pulse"] }), _jsxs("h1", { className: "lp-title lp-pop", style: { animationDelay: '110ms' }, children: [_jsx("span", { className: "lp-title-line", children: "A clean slate" }), _jsx("span", { className: "lp-title-line lp-title-line-2", children: "for your" }), _jsx("span", { className: "lp-rotor", children: _jsx("span", { className: "lp-rotor-word", children: SLATE_WORDS[wordIndex] }, wordIndex) })] }), _jsx("p", { className: "lp-lede lp-pop", style: { animationDelay: '190ms' }, children: "Slate is a fast little markdown notebook that doesn't nag, sync-spin, or hide your words behind a database. Type. Tag. Close the laptop. It'll all still be there." }), _jsxs("div", { className: "lp-cta-row lp-pop", style: { animationDelay: '260ms' }, children: [_jsxs("button", { type: "button", className: "lp-btn lp-btn-primary lp-btn-lg", onClick: () => onLaunch('signUp'), children: ["Start writing \u2014 free", _jsx(ChevronRight, { size: 17 })] }), _jsx("button", { type: "button", className: "lp-btn lp-btn-ghost lp-btn-lg", onClick: () => onLaunch('signIn'), children: "I've been here before" })] }), _jsxs("ul", { className: "lp-ticks lp-pop", style: { animationDelay: '330ms' }, children: [_jsxs("li", { children: [_jsx(CheckIcon, { size: 14 }), " no credit card"] }), _jsxs("li", { children: [_jsx(CheckIcon, { size: 14 }), " no onboarding tour"] }), _jsxs("li", { children: [_jsx(CheckIcon, { size: 14 }), " no folders, ever"] })] })] }), _jsx("div", { className: "lp-pop lp-pop-art", style: { animationDelay: '220ms' }, children: _jsx(MockWindow, {}) })] }), _jsx("div", { className: "lp-marquee", "aria-hidden": "true", children: _jsx("div", { className: "lp-marquee-track", children: [0, 1].map((copy) => (_jsx("div", { className: "lp-marquee-group", children: MARQUEE.map((item) => (_jsxs("span", { className: "lp-marquee-item", children: [item, _jsx(Star, { className: "lp-marquee-star" })] }, item))) }, copy))) }) }), _jsxs("section", { className: "lp-section lp-cheatsheet", children: [_jsxs("div", { className: "lp-section-head", children: [_jsxs("h2", { className: "lp-h2", children: ["Type this", _jsx(Squiggle, { className: "lp-squiggle" }), "get that"] }), _jsx("p", { className: "lp-section-sub", children: "Type the markdown you already half-remember \u2014 headings, todos, and tags light up as you go." })] }), _jsx("div", { className: "lp-cheat-grid", children: CHEATS.map((cheat) => (_jsxs("div", { className: "lp-cheat", children: [_jsx("code", { className: "lp-cheat-raw", children: cheat.raw }), _jsx("span", { className: "lp-cheat-arrow", "aria-hidden": "true", children: "\u2192" }), _jsx("span", { className: "lp-cheat-out", children: cheat.render })] }, cheat.raw))) })] }), _jsxs("section", { className: "lp-section", children: [_jsxs("div", { className: "lp-section-head", children: [_jsx("h2", { className: "lp-h2", children: "Four things, done properly" }), _jsx("p", { className: "lp-section-sub", children: "Instead of forty things done in a settings panel nobody opens." })] }), _jsx("div", { className: "lp-cards", children: CARDS.map((card) => (_jsxs("article", { className: "lp-card", "data-tone": card.tone, "data-wide": card.wide, children: [_jsx("span", { className: "lp-card-icon", children: _jsx(card.icon, { size: 20 }) }), _jsx("span", { className: "lp-card-kicker", children: card.kicker }), _jsx("h3", { className: "lp-card-title", children: card.title }), _jsx("p", { className: "lp-card-body", children: card.body })] }, card.title))) })] }), _jsx("section", { className: "lp-closer", children: _jsxs("div", { className: "lp-closer-inner", children: [_jsx("span", { className: "lp-closer-mark", children: _jsx(SlateMark, { size: 44 }) }), _jsx("h2", { className: "lp-closer-title", children: "Go on, write something down." }), _jsx("p", { className: "lp-closer-sub", children: "It takes about nine seconds to make an account, and roughly zero to start typing." }), _jsxs("button", { type: "button", className: "lp-btn lp-btn-honey lp-btn-lg", onClick: () => onLaunch('signUp'), children: ["Open a blank note", _jsx(ChevronRight, { size: 17 })] })] }) })] }), _jsxs("footer", { className: "lp-foot", children: [_jsxs("span", { className: "lp-foot-brand", children: [_jsx(SlateMark, { size: 15 }), "Slate"] }), _jsx("span", { children: "Built for people who think in plain text." })] })] }));
}
