import PDFDocument from 'pdfkit';

/**
 * Real Estate Comparison PDF — 2026 Design
 * Diagonal cover · Bento cards · Scorecard rows · Split recommendation
 */

const C = {
    ink:      '#0F172A',   // Near-black
    ink2:     '#1E293B',   // Dark card
    ink3:     '#334155',   // Dark muted

    teal:     '#0D9488',   // Primary accent
    tealDk:   '#0F766E',
    tealLt:   '#CCFBF1',

    green:    '#059669',
    greenLt:  '#ECFDF5',
    amber:    '#D97706',
    amberLt:  '#FFFBEB',
    red:      '#DC2626',
    redLt:    '#FEF2F2',
    violet:   '#7C3AED',

    white:    '#FFFFFF',
    bg:       '#FAFAFA',
    muted:    '#F1F5F9',
    border:   '#E2E8F0',
    borderMd: '#CBD5E1',

    txt:      '#0F172A',
    txtMed:   '#334155',
    txtSub:   '#64748B',
    txtMute:  '#94A3B8',
};

// ─────────────────────────────────────────────
export async function generateComparisonPDF(requirements, results, summary) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                bufferPages: true,
                info: {
                    Title: `Property Comparison Report — ${requirements.customerName || 'Client'}`,
                    Author: 'RealEstate Pro',
                    Subject: 'Property Comparison Report',
                    Creator: 'RealEstate Pro'
                }
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            pageCover(doc, requirements, summary);
            pageRequirements(doc, requirements, summary);
            pageScorecard(doc, results);
            pageBento(doc, results.slice(0, 5));
            if (results.length >= 2) pageSideBySide(doc, results.slice(0, 3));
            pageRecommendation(doc, results[0], requirements);

            addFooters(doc);
            doc.flushPages();
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

// ═══════════════════════════════════════════════════════
// PAGE 1 — COVER  (diagonal split dark/teal)
// ═══════════════════════════════════════════════════════
function pageCover(doc, requirements, summary) {
    const W = doc.page.width, H = doc.page.height;

    // Full dark base
    doc.rect(0, 0, W, H).fill(C.ink);

    // Diagonal teal panel — right side
    doc.save();
    doc.moveTo(W * 0.52, 0)
        .lineTo(W, 0)
        .lineTo(W, H)
        .lineTo(W * 0.52 - 72, H)
        .closePath()
        .fill(C.teal);
    doc.restore();

    // Subtle dot grid on teal panel (decorative)
    for (let row = 0; row < 18; row++) {
        for (let col = 0; col < 6; col++) {
            const dx = W * 0.56 + col * 26;
            const dy = 40 + row * 34;
            if (dx < W - 10) {
                doc.circle(dx, dy, 1.2).fill('rgba(255,255,255,0.18)');
            }
        }
    }

    // Brand label
    doc.fontSize(9).fillColor(C.txtMute).font('Helvetica')
        .text('REALESTATE PRO  ·  Property Intelligence', 52, 42);

    // Large stacked title
    doc.fontSize(56).fillColor(C.white).font('Helvetica-Bold')
        .text('Property', 52, 100, { lineBreak: false });
    doc.fontSize(56).fillColor(C.white).font('Helvetica-Bold')
        .text('Comparison', 52, 164, { lineBreak: false });
    doc.fontSize(56).fillColor(C.teal).font('Helvetica-Bold')
        .text('Report.', 52, 228, { lineBreak: false });

    // Thin rule + subtitle
    doc.rect(52, 302, 180, 2).fill(C.teal);
    doc.fontSize(11).fillColor(C.txtMute).font('Helvetica')
        .text('Personalized Analysis & Property Recommendations', 52, 314);

    // Year badge
    const yr = new Date().getFullYear();
    doc.roundedRect(52, 346, 60, 24, 4).fill(C.tealDk);
    doc.fontSize(9).fillColor(C.tealLt).font('Helvetica-Bold')
        .text(String(yr), 52, 352, { width: 60, align: 'center' });

    // Client card (dark glass)
    const cardY = 394;
    doc.roundedRect(52, cardY, W * 0.44, 100, 8).fill(C.ink2);
    doc.rect(52, cardY, 4, 100).fill(C.teal);

    doc.fontSize(8).fillColor(C.txtMute).font('Helvetica')
        .text('PREPARED FOR', 68, cardY + 16);
    doc.fontSize(20).fillColor(C.white).font('Helvetica-Bold')
        .text(requirements.customerName || 'Valued Client', 68, cardY + 30, { width: W * 0.44 - 30 });

    const contact = [requirements.email, requirements.phone].filter(Boolean).join('   ·   ');
    if (contact) {
        doc.fontSize(9.5).fillColor(C.txtSub).font('Helvetica')
            .text(contact, 68, cardY + 62);
    }

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text(today, 68, cardY + 80);

    // Stats strip — bottom
    const statsY = H - 112;
    const statBoxW = (W - 104) / 3;
    const statsData = [
        { n: String(summary?.totalMatches || 0),                 label: 'Properties Analysed', col: C.teal   },
        { n: String(summary?.excellentMatches || 0),             label: 'Excellent Matches',   col: C.green  },
        { n: shortCur(summary?.priceRange?.avg || 0),            label: 'Average Price',       col: C.amber  },
    ];

    statsData.forEach((s, i) => {
        const sx = 52 + i * (statBoxW + 10);
        doc.roundedRect(sx, statsY, statBoxW, 68, 6).fill(C.ink2);
        doc.rect(sx, statsY, statBoxW, 3).fill(s.col);

        doc.fontSize(26).fillColor(s.col).font('Helvetica-Bold')
            .text(s.n, sx, statsY + 12, { width: statBoxW, align: 'center' });
        doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
            .text(s.label, sx, statsY + 50, { width: statBoxW, align: 'center' });
    });
}

// ═══════════════════════════════════════════════════════
// PAGE 2 — REQUIREMENTS & SUMMARY
// ═══════════════════════════════════════════════════════
function pageRequirements(doc, requirements, summary) {
    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width;

    // Teal header band
    doc.rect(0, 0, W, 72).fill(C.teal);
    doc.fontSize(9).fillColor(C.tealLt).font('Helvetica')
        .text('02  ·  REQUIREMENTS', 52, 20);
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
        .text('Search Criteria & Results', 52, 36);
    doc.fontSize(9).fillColor(C.tealDk).font('Helvetica')
        .text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

    let y = 90;
    const mx = 52, cw = W - mx * 2;

    // ── Criteria tiles (2-col grid) ──
    chip_label(doc, 'SEARCH CRITERIA', mx, y);
    y += 18;

    const criteria = [
        { label: 'Bedrooms',   value: fmtRange(requirements.minBedrooms, requirements.maxBedrooms) },
        { label: 'Bathrooms',  value: fmtRange(requirements.minBathrooms, requirements.maxBathrooms) },
        { label: 'Area (sqm)', value: fmtRange(requirements.minArea, requirements.maxArea) },
        { label: 'Budget',     value: fmtCurRange(requirements.minBudget, requirements.maxBudget) },
        { label: 'Finishing',  value: fmtFin(requirements.finishingType) },
        { label: 'Contact',    value: requirements.email || requirements.phone || '—' },
    ];

    const tw = (cw - 10) / 2, th = 44;
    criteria.forEach((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const tx = mx + col * (tw + 10), ty = y + row * (th + 8);
        doc.roundedRect(tx, ty, tw, th, 5).fill(C.muted);
        doc.rect(tx, ty, 3, th).fill(C.teal);
        doc.fontSize(7.5).fillColor(C.txtSub).font('Helvetica')
            .text(c.label.toUpperCase(), tx + 10, ty + 8);
        doc.fontSize(12).fillColor(C.txt).font('Helvetica-Bold')
            .text(c.value, tx + 10, ty + 22, { width: tw - 20, lineBreak: false });
    });
    y += Math.ceil(criteria.length / 2) * (th + 8) + 8;

    // Location + type chips
    const locs = parseArr(requirements.preferredLocations);
    if (locs?.length) {
        doc.fontSize(8).fillColor(C.txtSub).font('Helvetica').text('Preferred Locations', mx, y);
        y += 14;
        y = drawChips(doc, locs, mx, y, cw, C.teal, C.tealLt) + 8;
    }
    const types = parseArr(requirements.preferredTypes);
    if (types?.length) {
        doc.fontSize(8).fillColor(C.txtSub).font('Helvetica').text('Property Types', mx, y);
        y += 14;
        y = drawChips(doc, types, mx, y, cw, C.ink, C.muted) + 8;
    }

    y += 10;
    doc.rect(mx, y, cw, 1).fill(C.border);
    y += 16;

    // ── Summary stats ──
    chip_label(doc, 'RESULTS SUMMARY', mx, y);
    y += 18;

    const stats = [
        { n: summary?.totalMatches || 0,     label: 'Total Matches',   col: C.teal  },
        { n: summary?.excellentMatches || 0, label: 'Excellent (90%+)',col: C.green },
        { n: summary?.goodMatches || 0,      label: 'Good (75%+)',     col: C.teal  },
        { n: shortCur(summary?.priceRange?.avg || 0), label: 'Avg. Price', col: C.amber },
    ];

    const sw = (cw - 18) / 4;
    stats.forEach((s, i) => {
        const sx = mx + i * (sw + 6);
        doc.roundedRect(sx, y, sw, 80, 6)
            .lineWidth(1).strokeColor(C.border).fillAndStroke(C.white, C.border);
        doc.rect(sx, y, sw, 4).fill(s.col);

        const isNum = typeof s.n === 'number';
        doc.fontSize(isNum ? 32 : 14).fillColor(s.col).font('Helvetica-Bold')
            .text(String(s.n), sx, y + 14, { width: sw, align: 'center' });
        doc.fontSize(8.5).fillColor(C.txtSub).font('Helvetica')
            .text(s.label, sx, y + 60, { width: sw, align: 'center' });
    });
    y += 96;

    // Great news
    if (summary?.excellentMatches > 0) {
        doc.roundedRect(mx, y, cw, 52, 6).fill(C.greenLt);
        doc.rect(mx, y, 4, 52).fill(C.green);
        doc.fontSize(11).fillColor(C.green).font('Helvetica-Bold')
            .text(`${summary.excellentMatches} Excellent Match${summary.excellentMatches > 1 ? 'es' : ''} Found!`, mx + 16, y + 10);
        doc.fontSize(10).fillColor(C.txtMed).font('Helvetica')
            .text('These properties meet 90% or more of your stated requirements.',
                mx + 16, y + 30, { width: cw - 24 });
    }
}

// ═══════════════════════════════════════════════════════
// PAGE 3 — SCORECARD (horizontal property rows)
// ═══════════════════════════════════════════════════════
function pageScorecard(doc, results) {
    if (!results?.length) return;

    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width;

    doc.rect(0, 0, W, 72).fill(C.ink);
    doc.fontSize(9).fillColor(C.txtMute).font('Helvetica').text('03  ·  SCORECARD', 52, 20);
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('Property Scorecard', 52, 36);
    doc.fontSize(9).fillColor(C.ink3).font('Helvetica').text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

    let y = 84;
    const mx = 52, cw = W - mx * 2;

    results.slice(0, 10).forEach((result, idx) => {
        const cardH = 62;
        if (y + cardH > 766) {
            doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
            doc.rect(0, 0, W, 72).fill(C.ink);
            doc.fontSize(9).fillColor(C.txtMute).font('Helvetica').text('03  ·  SCORECARD (CONT.)', 52, 20);
            doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('Property Scorecard', 52, 36);
            y = 84;
        }

        const unit = result.unit, compound = unit?.compound || {}, dev = compound?.developer || {};
        const mc = matchCol(result.matchPercentage);
        const isTop = idx === 0;

        // Card base
        doc.roundedRect(mx, y, cw, cardH, 6)
            .lineWidth(1).strokeColor(isTop ? mc : C.border)
            .fillAndStroke(isTop ? C.muted : C.white, isTop ? mc : C.border);

        // Left match color strip
        doc.save();
        doc.rect(mx, y, 5, cardH).clip();
        doc.roundedRect(mx, y, 5, cardH, 3).fill(mc);
        doc.restore();

        // Rank — large bold number
        const rankX = mx + 18;
        doc.fontSize(isTop ? 11 : 20).fillColor(isTop ? mc : C.border).font('Helvetica-Bold')
            .text(isTop ? 'TOP' : String(idx + 1).padStart(2, '0'), rankX - 8, isTop ? y + 24 : y + 20, { width: 36, align: 'center' });

        // Property info
        const infoX = mx + 62;
        doc.fontSize(11).fillColor(C.txt).font('Helvetica-Bold')
            .text(compound.name || '—', infoX, y + 10, { width: 170, lineBreak: false });
        doc.fontSize(8.5).fillColor(C.txtSub).font('Helvetica')
            .text(`${dev.name || '—'}  ·  ${compound.location || '—'}`, infoX, y + 26, { width: 170 });

        // Unit type badge
        const typeW = doc.fontSize(7.5).widthOfString(cap(unit.type || '—')) + 12;
        doc.roundedRect(infoX, y + 42, typeW, 13, 3).fill(C.muted);
        doc.fontSize(7.5).fillColor(C.txtSub).font('Helvetica')
            .text(cap(unit.type || '—'), infoX, y + 45, { width: typeW, align: 'center' });

        // Specs — inline
        const specsX = mx + 246;
        const specs = [
            `${unit.bedrooms || '—'} Bed`,
            `${unit.bathrooms || '—'} Bath`,
            `${unit.area || '—'} sqm`,
            unit.floor ? `Fl.${unit.floor}` : null,
        ].filter(Boolean);

        specs.forEach((sp, si) => {
            const spX = specsX + si * 54;
            if (spX + 48 > mx + cw - 100) return;
            doc.fontSize(8).fillColor(C.txtSub).font('Helvetica').text(sp, spX, y + 14, { lineBreak: false });
        });

        // Finishing
        doc.fontSize(7.5).fillColor(C.txtMute).font('Helvetica')
            .text(fmtFin(unit.finishingType), specsX, y + 30, { lineBreak: false });

        // Price
        const priceX = W - mx - 140;
        doc.fontSize(12).fillColor(C.teal).font('Helvetica-Bold')
            .text(shortCur(unit.price), priceX, y + 10, { width: 80, align: 'right', lineBreak: false });
        const ppsqm = unit.pricePerSqm || (unit.price && unit.area ? unit.price / unit.area : 0);
        doc.fontSize(8).fillColor(C.txtMute).font('Helvetica')
            .text(`${shortCur(ppsqm)}/sqm`, priceX, y + 28, { width: 80, align: 'right' });

        // Score pill
        const pillX = W - mx - 50;
        doc.roundedRect(pillX, y + 10, 46, 42, 6).fill(mc);
        doc.fontSize(16).fillColor(C.white).font('Helvetica-Bold')
            .text(`${result.matchPercentage}`, pillX, y + 15, { width: 46, align: 'center' });
        doc.fontSize(7.5).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
            .text('%', pillX, y + 33, { width: 46, align: 'center' });

        y += cardH + 8;
    });
}

// ═══════════════════════════════════════════════════════
// PAGE 4 — BENTO TOP 5
// ═══════════════════════════════════════════════════════
function pageBento(doc, topResults) {
    if (!topResults?.length) return;

    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width;

    doc.rect(0, 0, W, 72).fill(C.teal);
    doc.fontSize(9).fillColor(C.tealDk).font('Helvetica').text('04  ·  TOP PICKS', 52, 20);
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('Top Recommended Properties', 52, 36);
    doc.fontSize(9).fillColor(C.tealDk).font('Helvetica').text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

    let y = 82;
    const mx = 52, cw = W - mx * 2;

    topResults.forEach((result, idx) => {
        const bannerH = 52, bodyH = 100, cardH = bannerH + bodyH;
        if (y + cardH > 766) {
            doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
            doc.rect(0, 0, W, 72).fill(C.teal);
            doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('Top Properties (cont.)', 52, 36);
            y = 82;
        }

        const unit = result.unit, compound = unit?.compound || {}, dev = compound?.developer || {};
        const mc = matchCol(result.matchPercentage);
        const isTop = idx === 0;

        // Outer card
        doc.roundedRect(mx, y, cw, cardH, 8)
            .lineWidth(1).strokeColor(C.border).fillAndStroke(C.white, C.border);

        // ── Banner (colored top) ──
        doc.save();
        doc.rect(mx, y, cw, bannerH).clip();
        doc.roundedRect(mx, y, cw, bannerH, 8).fill(isTop ? C.ink : mc + 'DD');
        doc.restore();

        // Rank chip inside banner
        const rankChipW = isTop ? 64 : 28;
        doc.roundedRect(mx + 14, y + 14, rankChipW, 22, 4).fill(isTop ? mc : 'rgba(255,255,255,0.25)');
        doc.fontSize(isTop ? 8 : 11).fillColor(C.white).font('Helvetica-Bold')
            .text(isTop ? 'TOP PICK' : `#${idx + 1}`, mx + 14, y + 19, { width: rankChipW, align: 'center' });

        // Large score on right of banner
        doc.fontSize(28).fillColor(C.white).font('Helvetica-Bold')
            .text(`${result.matchPercentage}%`, mx + cw - 90, y + 10, { width: 76, align: 'right' });
        doc.fontSize(8).fillColor('rgba(255,255,255,0.6)').font('Helvetica')
            .text('MATCH SCORE', mx + cw - 90, y + 40, { width: 76, align: 'right' });

        // Property name + developer centered in banner
        const nameX = mx + 14 + rankChipW + 10;
        doc.fontSize(13).fillColor(C.white).font('Helvetica-Bold')
            .text(compound.name || '—', nameX, y + 10, { width: cw - rankChipW - 120, lineBreak: false });
        doc.fontSize(9).fillColor('rgba(255,255,255,0.65)').font('Helvetica')
            .text(`${dev.name || '—'}  ·  ${compound.location || '—'}`, nameX, y + 30, { width: cw - rankChipW - 120, lineBreak: false });

        // ── Body ──
        const bodyY = y + bannerH;

        // Spec boxes row
        const specDefs = [
            { l: 'Beds',      v: String(unit.bedrooms || '—') },
            { l: 'Baths',     v: String(unit.bathrooms || '—') },
            { l: 'Area',      v: `${unit.area || '—'}m²` },
            { l: 'Floor',     v: unit.floor ? `Fl.${unit.floor}` : '—' },
            { l: 'View',      v: cap(unit.view || '—') },
            { l: 'Finish',    v: abrvFin(unit.finishingType) },
        ];
        const sbW = (cw - 10) / 6;
        specDefs.forEach((s, si) => {
            const sx = mx + si * (sbW + 2);
            doc.roundedRect(sx, bodyY + 8, sbW, 36, 3).fill(C.muted);
            doc.fontSize(6.5).fillColor(C.txtMute).font('Helvetica')
                .text(s.l, sx, bodyY + 12, { width: sbW, align: 'center' });
            doc.fontSize(11).fillColor(C.txt).font('Helvetica-Bold')
                .text(s.v, sx, bodyY + 22, { width: sbW, align: 'center' });
        });

        // Price row
        const priceY = bodyY + 52;
        doc.fontSize(14).fillColor(C.teal).font('Helvetica-Bold')
            .text(fullCur(unit.price), mx + 4, priceY, { lineBreak: false });
        const ppsqm = unit.pricePerSqm || (unit.price && unit.area ? unit.price / unit.area : 0);
        doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
            .text(`${shortCur(ppsqm)}/sqm`, mx + 180, priceY + 2, { lineBreak: false });

        // Score bars
        const barsY = priceY + 20;
        const scoreEntries = Object.entries(result.scores || {});
        const bw = Math.floor((cw - (scoreEntries.length - 1) * 6) / scoreEntries.length);
        scoreEntries.forEach(([key, val], bi) => {
            miniBar(doc, mx + bi * (bw + 6), barsY, bw, key, val);
        });

        // Highlights
        const hlY = barsY + 22;
        const hls = result.highlights?.highlights?.slice(0, 3) || [];
        const cns = result.highlights?.concerns?.slice(0, 1) || [];
        let tagX = mx + 4;
        [...hls.map(h => ({ t: `+ ${h}`, c: C.green, bg: C.greenLt })),
         ...cns.map(c => ({ t: `! ${c}`, c: C.amber, bg: C.amberLt }))
        ].forEach(tag => {
            const tw2 = doc.fontSize(7.5).widthOfString(tag.t) + 14;
            if (tagX + tw2 > mx + cw) return;
            doc.roundedRect(tagX, hlY, tw2, 14, 3).fill(tag.bg);
            doc.fontSize(7.5).fillColor(tag.c).font('Helvetica')
                .text(tag.t, tagX + 4, hlY + 3, { lineBreak: false });
            tagX += tw2 + 5;
        });

        y += cardH + 10;
    });
}

// ═══════════════════════════════════════════════════════
// PAGE 5 — SIDE-BY-SIDE (top 3)
// ═══════════════════════════════════════════════════════
function pageSideBySide(doc, results) {
    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width;

    doc.rect(0, 0, W, 72).fill(C.ink);
    doc.fontSize(9).fillColor(C.txtMute).font('Helvetica').text('05  ·  COMPARISON', 52, 20);
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('Top 3 Side-by-Side', 52, 36);
    doc.fontSize(9).fillColor(C.ink3).font('Helvetica').text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

    const mx = 52, cw = W - mx * 2;
    const n = Math.min(results.length, 3);
    const colW = Math.floor((cw - (n - 1) * 8) / n);
    const colXs = Array.from({ length: n }, (_, i) => mx + i * (colW + 8));

    let y = 82;

    // Column headers
    colXs.forEach((cx, i) => {
        const r = results[i];
        const mc = matchCol(r.matchPercentage);
        const isTop = i === 0;

        doc.roundedRect(cx, y, colW, 64, 6).fill(isTop ? C.ink : C.ink2);
        doc.rect(cx, y, colW, 4).fill(isTop ? mc : mc);

        if (isTop) {
            doc.roundedRect(cx + 8, y + 8, 56, 16, 3).fill(mc);
            doc.fontSize(7.5).fillColor(C.white).font('Helvetica-Bold')
                .text('TOP PICK', cx + 8, y + 12, { width: 56, align: 'center' });
        }
        doc.fontSize(isTop ? 10 : 11).fillColor(C.white).font('Helvetica-Bold')
            .text(r.unit?.compound?.name || `Property ${i + 1}`, cx + 6, isTop ? y + 30 : y + 18, { width: colW - 12, align: 'center' });
        doc.fontSize(9).fillColor(mc).font('Helvetica-Bold')
            .text(`${r.matchPercentage}% match`, cx, isTop ? y + 48 : y + 38, { width: colW, align: 'center' });
    });
    y += 72;

    // Attribute rows
    const attrs = [
        { label: 'Location',   get: r => r.unit?.compound?.location || '—' },
        { label: 'Type',       get: r => cap(r.unit?.type || '—') },
        { label: 'Bedrooms',   get: r => String(r.unit?.bedrooms || '—'),  num: r => r.unit?.bedrooms || 0,    best: 'high' },
        { label: 'Bathrooms',  get: r => String(r.unit?.bathrooms || '—'), num: r => r.unit?.bathrooms || 0,   best: 'high' },
        { label: 'Area (sqm)', get: r => `${r.unit?.area || '—'}`,         num: r => r.unit?.area || 0,        best: 'high' },
        { label: 'Price',      get: r => shortCur(r.unit?.price),           num: r => r.unit?.price || 0,       best: 'low'  },
        { label: '/sqm',       get: r => shortCur(r.unit?.pricePerSqm || (r.unit?.price && r.unit?.area ? r.unit.price / r.unit.area : 0)),
                               num: r => r.unit?.pricePerSqm || (r.unit?.price && r.unit?.area ? r.unit.price / r.unit.area : 0), best: 'low' },
        { label: 'Finishing',  get: r => fmtFin(r.unit?.finishingType) },
        { label: 'Floor',      get: r => r.unit?.floor ? `Floor ${r.unit.floor}` : '—' },
        { label: 'View',       get: r => cap(r.unit?.view || '—') },
        { label: 'Match',      get: r => `${r.matchPercentage}%`,           num: r => r.matchPercentage,        best: 'high' },
    ];

    const rowH = 25;
    attrs.forEach((attr, ai) => {
        const rowBg = ai % 2 === 0 ? C.white : C.muted;
        doc.rect(mx, y, cw, rowH).fill(rowBg);

        // Row label
        doc.fontSize(8).fillColor(C.txtSub).font('Helvetica-Bold')
            .text(attr.label, mx + 3, y + 8);

        // Best value index
        let bestIdx = -1;
        if (attr.num && attr.best) {
            const vals = results.slice(0, n).map(attr.num);
            bestIdx = attr.best === 'high'
                ? vals.indexOf(Math.max(...vals))
                : vals.indexOf(Math.min(...vals.filter(v => v > 0)));
        }

        colXs.forEach((cx, ci) => {
            const val = attr.get(results[ci]);
            const isBest = bestIdx === ci;
            if (isBest) {
                doc.rect(cx + 2, y + 2, colW - 4, rowH - 4).fill(C.tealLt);
            }
            doc.fontSize(9)
                .fillColor(isBest ? C.teal : C.txtMed)
                .font(isBest ? 'Helvetica-Bold' : 'Helvetica')
                .text(val + (isBest ? ' ★' : ''), cx + 4, y + 8, { width: colW - 8, align: 'center', lineBreak: false });
        });

        doc.rect(mx, y + rowH - 0.5, cw, 0.5).fill(C.border);
        y += rowH;
    });

    // Outer border
    doc.roundedRect(mx, 82 + 72, cw, y - 82 - 72, 4)
        .lineWidth(1).strokeColor(C.border).stroke();

    y += 10;
    doc.fontSize(8).fillColor(C.txtSub).font('Helvetica')
        .text('★  Best value in category', mx, y);
}

// ═══════════════════════════════════════════════════════
// PAGE 6 — RECOMMENDATION (split layout)
// ═══════════════════════════════════════════════════════
function pageRecommendation(doc, topResult, requirements) {
    if (!topResult) return;

    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width, H = doc.page.height;

    const unit = topResult.unit, compound = unit?.compound || {}, dev = compound?.developer || {};
    const mc = matchCol(topResult.matchPercentage);

    // ── Left dark panel (42%) ──
    const leftW = Math.round(W * 0.42);
    doc.rect(0, 0, leftW, H).fill(C.ink);

    // Accent top strip
    doc.rect(0, 0, leftW, 5).fill(mc);

    // Page label
    doc.fontSize(9).fillColor(C.txtMute).font('Helvetica').text('06  ·  RECOMMENDATION', 24, 20);

    // "#1 Recommended" badge
    doc.roundedRect(24, 42, 110, 20, 4).fill(mc);
    doc.fontSize(8).fillColor(C.white).font('Helvetica-Bold')
        .text('#1 RECOMMENDED', 24, 47, { width: 110, align: 'center' });

    // Score ring — large
    const ringCX = leftW / 2, ringCY = 180;
    bigRing(doc, ringCX, ringCY, 56, topResult.matchPercentage, mc);

    doc.fontSize(9).fillColor(C.txtMute).font('Helvetica')
        .text('MATCH SCORE', 0, ringCY + 66, { width: leftW, align: 'center' });

    // Property name
    doc.fontSize(16).fillColor(C.white).font('Helvetica-Bold')
        .text(compound.name || '—', 16, ringCY + 84, { width: leftW - 32, align: 'center' });
    doc.fontSize(9).fillColor(C.txtSub).font('Helvetica')
        .text(`${cap(unit.type || '—')} by ${dev.name || '—'}`, 16, ringCY + 108, { width: leftW - 32, align: 'center' });
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text(compound.location || '—', 16, ringCY + 126, { width: leftW - 32, align: 'center' });

    // Divider
    doc.rect(24, ringCY + 148, leftW - 48, 1).fill(C.ink2);

    // Why this property
    doc.fontSize(9).fillColor(C.txtMute).font('Helvetica-Bold')
        .text('WHY THIS PROPERTY', 24, ringCY + 162);

    const reasons = [];
    if (topResult.matchPercentage >= 90) reasons.push('Excellent overall — meets 90%+ of requirements');
    if (topResult.highlights?.highlights) reasons.push(...topResult.highlights.highlights.slice(0, 3));
    if (!reasons.length) reasons.push('Best overall match for your criteria');

    let ry = ringCY + 180;
    reasons.forEach(r => {
        doc.circle(32, ry + 5, 2.5).fill(mc);
        doc.fontSize(9).fillColor(C.txtSub).font('Helvetica')
            .text(r, 40, ry, { width: leftW - 54, lineBreak: true });
        ry += 20;
    });

    // ── Right white panel ──
    const rightX = leftW;
    const rightW = W - leftW;

    doc.rect(rightX, 0, rightW, H).fill(C.white);
    doc.rect(rightX, 0, 1, H).fill(C.border);

    // Right content header
    doc.fontSize(11).fillColor(C.txt).font('Helvetica-Bold')
        .text('Property Details', rightX + 24, 24);
    doc.rect(rightX + 24, 44, rightW - 48, 1).fill(C.border);

    // Spec grid 2×3
    const specs = [
        { l: 'Bedrooms',  v: String(unit.bedrooms || '—') },
        { l: 'Bathrooms', v: String(unit.bathrooms || '—') },
        { l: 'Area',      v: `${unit.area || '—'} sqm` },
        { l: 'Floor',     v: unit.floor ? `Floor ${unit.floor}` : '—' },
        { l: 'View',      v: cap(unit.view || '—') },
        { l: 'Finishing', v: fmtFin(unit.finishingType) },
    ];
    const sbW = (rightW - 60) / 3, sbH = 50;
    specs.forEach((s, i) => {
        const row = Math.floor(i / 3), col = i % 3;
        const sx = rightX + 24 + col * (sbW + 6);
        const sy = 54 + row * (sbH + 8);
        doc.roundedRect(sx, sy, sbW, sbH, 5).fill(C.muted);
        doc.rect(sx, sy, sbW, 3).fill(mc);
        doc.fontSize(7.5).fillColor(C.txtMute).font('Helvetica')
            .text(s.l.toUpperCase(), sx, sy + 10, { width: sbW, align: 'center' });
        doc.fontSize(13).fillColor(C.txt).font('Helvetica-Bold')
            .text(s.v, sx, sy + 24, { width: sbW, align: 'center' });
    });

    // Price block
    const priceY = 54 + 2 * (sbH + 8) + 8;
    doc.roundedRect(rightX + 24, priceY, rightW - 48, 56, 6).fill(C.ink);
    doc.fontSize(9).fillColor(C.txtMute).font('Helvetica')
        .text('TOTAL PRICE', rightX + 38, priceY + 10);
    doc.fontSize(20).fillColor(C.white).font('Helvetica-Bold')
        .text(fullCur(unit.price), rightX + 38, priceY + 26);
    const ppsqm = unit.price && unit.area ? unit.price / unit.area : 0;
    doc.fontSize(10).fillColor(mc).font('Helvetica-Bold')
        .text(`${shortCur(ppsqm)}/sqm`, rightX + 24, priceY + 28, { width: rightW - 48, align: 'right' });

    // Score breakdown
    const scoresY = priceY + 68;
    doc.fontSize(9).fillColor(C.txt).font('Helvetica-Bold')
        .text('Score Breakdown', rightX + 24, scoresY);

    const scoreEntries = Object.entries(topResult.scores || {});
    scoreEntries.forEach(([key, val], i) => {
        const row = Math.floor(i / 2), col = i % 2;
        const bW = (rightW - 60) / 2;
        const bx = rightX + 24 + col * (bW + 12);
        const by = scoresY + 16 + row * 30;
        fullBar(doc, bx, by, bW, key, val, mc);
    });

    // CTA — bottom strip spanning both panels
    const ctaH = 52;
    doc.rect(0, H - ctaH, W, ctaH).fill(mc);
    doc.fontSize(13).fillColor(C.white).font('Helvetica-Bold')
        .text('Ready to Schedule a Viewing?', 52, H - ctaH + 10);
    doc.fontSize(9.5).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
        .text('Contact us today to arrange a tour and learn more about this opportunity.',
            52, H - ctaH + 30, { width: W - 104 });
}

// ═══════════════════════════════════════════════════════
// FOOTERS
// ═══════════════════════════════════════════════════════
function addFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        const W = doc.page.width, H = doc.page.height;
        doc.rect(0, H - 26, W, 26).fill(C.ink);
        doc.fontSize(7.5).fillColor(C.ink3).font('Helvetica')
            .text('CONFIDENTIAL', 52, H - 16);
        doc.text(`Page ${i + 1} of ${range.count}`, 52, H - 16,
            { width: W - 104, align: 'center' });
        doc.text(new Date().toLocaleDateString(), W - 160, H - 16,
            { width: 108, align: 'right' });
    }
}

// ═══════════════════════════════════════════════════════
// DRAWING HELPERS
// ═══════════════════════════════════════════════════════

function bigRing(doc, cx, cy, r, pct, color) {
    const lw = 8;
    doc.circle(cx, cy, r).lineWidth(lw).strokeColor(C.ink2).stroke();
    if (pct > 0) {
        const a0 = -Math.PI / 2;
        const a1 = a0 + (2 * Math.PI * Math.min(pct, 99.9) / 100);
        const x1 = cx + r * Math.cos(a0), y1 = cy + r * Math.sin(a0);
        const x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1);
        doc.save();
        doc.path(`M ${x1} ${y1} A ${r} ${r} 0 ${pct > 50 ? 1 : 0} 1 ${x2} ${y2}`)
            .lineWidth(lw).lineCap('round').strokeColor(color).stroke();
        doc.restore();
    }
    doc.fontSize(26).fillColor(color).font('Helvetica-Bold')
        .text(`${pct}%`, cx - r, cy - 16, { width: r * 2, align: 'center' });
}

function miniBar(doc, x, y, w, label, score) {
    const pct = Math.max(0, Math.min(1, score || 0));
    const col = pct >= 0.9 ? C.green : pct >= 0.75 ? C.teal : pct >= 0.6 ? C.amber : C.red;
    doc.fontSize(6.5).fillColor(C.txtMute).font('Helvetica')
        .text(label, x, y, { width: w, lineBreak: false });
    doc.roundedRect(x, y + 10, w, 5, 2).fill(C.muted);
    if (pct > 0) doc.roundedRect(x, y + 10, Math.max(4, Math.round(w * pct)), 5, 2).fill(col);
}

function fullBar(doc, x, y, w, label, score, accentCol = C.teal) {
    const pct = Math.max(0, Math.min(1, score || 0));
    const col = pct >= 0.9 ? C.green : pct >= 0.75 ? accentCol : pct >= 0.6 ? C.amber : C.red;
    const lbl = label.charAt(0).toUpperCase() + label.slice(1);
    doc.fontSize(8.5).fillColor(C.txtSub).font('Helvetica').text(lbl, x, y + 2, { width: 60, lineBreak: false });
    const bx = x + 64, bw = w - 90;
    doc.roundedRect(bx, y + 5, bw, 7, 3).fill(C.muted);
    if (pct > 0) doc.roundedRect(bx, y + 5, Math.max(4, Math.round(bw * pct)), 7, 3).fill(col);
    doc.fontSize(9).fillColor(col).font('Helvetica-Bold')
        .text(`${Math.round(pct * 100)}%`, bx + bw + 4, y + 2, { width: 28 });
}

function drawChips(doc, items, startX, y, maxW, textCol, bgCol) {
    let cx = startX;
    const pH = 20;
    items.forEach(item => {
        const iw = doc.fontSize(8.5).widthOfString(item) + 18;
        if (cx + iw > startX + maxW) { cx = startX; y += pH + 5; }
        doc.roundedRect(cx, y, iw, pH, 4).fill(bgCol);
        doc.fontSize(8.5).fillColor(textCol).font('Helvetica-Bold')
            .text(item, cx, y + 6, { width: iw, align: 'center' });
        cx += iw + 6;
    });
    return y + pH;
}

function chip_label(doc, text, x, y) {
    doc.fontSize(7.5).fillColor(C.txtMute).font('Helvetica-Bold').text(text, x, y);
}

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════
function matchCol(pct) {
    if (pct >= 90) return C.green;
    if (pct >= 75) return C.teal;
    if (pct >= 60) return C.amber;
    return C.red;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'; }

function fmtRange(min, max) {
    if (!min && !max) return 'Any';
    if (min && max) return `${min} – ${max}`;
    if (min) return `${min}+`;
    return `Up to ${max}`;
}

function fmtCurRange(min, max) {
    if (!min && !max) return 'Any';
    if (min && max) return `${shortCur(min)} – ${shortCur(max)}`;
    if (min) return `${shortCur(min)}+`;
    return `Up to ${shortCur(max)}`;
}

function fullCur(n) {
    if (!n) return 'N/A';
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);
}

function shortCur(n) {
    if (!n) return 'N/A';
    if (n >= 1_000_000) return `EGP ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `EGP ${(n / 1_000).toFixed(0)}K`;
    return `EGP ${Math.round(n)}`;
}

function fmtFin(t) {
    if (!t) return 'Any';
    return t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function abrvFin(t) {
    if (!t) return '—';
    if (t.includes('fully'))  return 'Full';
    if (t.includes('semi'))   return 'Semi';
    if (t.includes('core'))   return 'Core';
    return cap(t);
}

function parseArr(val) {
    if (!val) return null;
    try {
        const a = typeof val === 'string' ? JSON.parse(val) : val;
        return Array.isArray(a) && a.length ? a : null;
    } catch { return null; }
}
