import PDFDocument from 'pdfkit';

/**
 * Real Estate Comparison PDF — Black & Gold Elegant Edition
 */

const C = {
    // ── Blacks ──
    black:    '#0B0B0B',
    black2:   '#141414',
    black3:   '#1C1C1C',
    black4:   '#282828',

    // ── Golds ──
    gold:     '#C9A84C',   // Primary gold
    goldDk:   '#A07830',   // Dark gold
    goldLt:   '#E8CC7A',   // Light gold
    goldPale: '#F9F3DC',   // Pale gold (highlights on light bg)
    goldRule: '#3A2E10',   // Very dark gold for subtle decorative elements

    // ── Light backgrounds ──
    white:    '#FFFFFF',
    cream:    '#FAF8F2',   // Warm page background
    offWhite: '#F2EDE0',   // Slightly darker cream for alternating rows

    // ── Status ──
    green:    '#2D7D46',
    greenLt:  '#E8F5EC',
    amber:    '#B87010',
    amberLt:  '#FEF3E2',
    red:      '#B83232',
    redLt:    '#FCE8E8',

    // ── Text ──
    txt:      '#0B0B0B',
    txtMed:   '#2A2A2A',
    txtSub:   '#5A5A5A',
    txtMute:  '#8A8A8A',

    // ── Borders ──
    border:   '#E0D8C4',   // Warm light border
    borderDk: '#252525',   // Dark border
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
// PAGE 1 — COVER  (full black · gold accents)
// ═══════════════════════════════════════════════════════
function pageCover(doc, requirements, summary) {
    const W = doc.page.width, H = doc.page.height;

    // Full black base
    doc.rect(0, 0, W, H).fill(C.black);

    // Decorative: hollow arcs — top right
    doc.save();
    doc.circle(W + 50, -30, 290).lineWidth(0.7).strokeColor(C.goldRule).stroke();
    doc.circle(W + 50, -30, 220).lineWidth(0.4).strokeColor(C.goldRule).stroke();
    doc.restore();

    // Decorative: hollow arc — bottom left
    doc.save();
    doc.circle(-50, H + 40, 250).lineWidth(0.5).strokeColor(C.goldRule).stroke();
    doc.restore();

    // Gold dot + brand label
    doc.rect(52, 40, 4, 4).fill(C.gold);
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text('REALESTATE PRO  ·  Property Intelligence', 62, 39, { characterSpacing: 0.4 });

    // Thin gold rule under brand
    doc.rect(52, 56, W - 104, 0.5).fill(C.goldRule);

    // ── Main title ──
    doc.fontSize(62).fillColor(C.white).font('Helvetica-Bold')
        .text('Property', 52, 84, { lineBreak: false });
    doc.fontSize(62).fillColor(C.white).font('Helvetica-Bold')
        .text('Comparison', 52, 156, { lineBreak: false });
    doc.fontSize(62).fillColor(C.gold).font('Helvetica-Bold')
        .text('Report.', 52, 228, { lineBreak: false });

    // Gold rule + subtitle
    doc.rect(52, 308, 210, 1.5).fill(C.gold);
    doc.fontSize(10.5).fillColor(C.txtMute).font('Helvetica')
        .text('Personalized Property Analysis & Recommendations', 52, 320);

    // Year badge — outlined
    const yr = new Date().getFullYear();
    doc.roundedRect(52, 350, 58, 22, 3)
        .lineWidth(1).strokeColor(C.gold).stroke();
    doc.fontSize(9).fillColor(C.gold).font('Helvetica-Bold')
        .text(String(yr), 52, 356, { width: 58, align: 'center' });

    // ── Client card ──
    const cardY = 392;
    const cardW = Math.round(W * 0.54);
    doc.roundedRect(52, cardY, cardW, 102, 6).fill(C.black3);
    doc.rect(52, cardY, 3, 102).fill(C.gold);

    doc.fontSize(7.5).fillColor(C.gold).font('Helvetica-Bold')
        .text('PREPARED FOR', 68, cardY + 14, { characterSpacing: 1 });
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
        .text(requirements.customerName || 'Valued Client', 68, cardY + 28, { width: cardW - 32 });

    const contact = [requirements.email, requirements.phone].filter(Boolean).join('   ·   ');
    if (contact) {
        doc.fontSize(9.5).fillColor(C.txtSub).font('Helvetica')
            .text(contact, 68, cardY + 62);
    }
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text(today, 68, cardY + 80);

    // ── Stats strip ──
    const statsY = H - 120;
    const statBoxW = (W - 104) / 3;

    // Thin gold rule above stats
    doc.rect(52, statsY - 12, W - 104, 0.5).fill(C.goldRule);

    const statsData = [
        { n: String(summary?.totalMatches || 0),      label: 'Properties Analysed' },
        { n: String(summary?.excellentMatches || 0),  label: 'Excellent Matches' },
        { n: shortCur(summary?.priceRange?.avg || 0), label: 'Average Price' },
    ];

    statsData.forEach((s, i) => {
        const sx = 52 + i * (statBoxW + 10);
        doc.roundedRect(sx, statsY, statBoxW, 72, 5).fill(C.black3);
        doc.rect(sx, statsY, statBoxW, 2).fill(C.gold);

        doc.fontSize(28).fillColor(C.gold).font('Helvetica-Bold')
            .text(s.n, sx, statsY + 12, { width: statBoxW, align: 'center' });
        doc.fontSize(8).fillColor(C.txtMute).font('Helvetica')
            .text(s.label, sx, statsY + 54, { width: statBoxW, align: 'center' });
    });
}

// ═══════════════════════════════════════════════════════
// PAGE 2 — REQUIREMENTS
// ═══════════════════════════════════════════════════════
function pageRequirements(doc, requirements, summary) {
    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width;

    // Cream body background
    doc.rect(0, 0, W, doc.page.height).fill(C.cream);

    // Black header + gold underline
    doc.rect(0, 0, W, 68).fill(C.black);
    doc.rect(0, 68, W, 2).fill(C.gold);
    doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
        .text('02  ·  REQUIREMENTS', 52, 18, { characterSpacing: 1 });
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
        .text('Search Criteria & Results', 52, 33);
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

    let y = 90;
    const mx = 52, cw = W - mx * 2;

    sectionLabel(doc, 'SEARCH CRITERIA', mx, y);
    y += 18;

    const criteria = [
        { label: 'Bedrooms',   value: fmtRange(requirements.minBedrooms, requirements.maxBedrooms) },
        { label: 'Bathrooms',  value: fmtRange(requirements.minBathrooms, requirements.maxBathrooms) },
        { label: 'Area (sqm)', value: fmtRange(requirements.minArea, requirements.maxArea) },
        { label: 'Budget',     value: fmtCurRange(requirements.minBudget, requirements.maxBudget) },
        { label: 'Finishing',  value: fmtFin(requirements.finishingType) },
        { label: 'Contact',    value: requirements.email || requirements.phone || '—' },
    ];

    const tw = (cw - 10) / 2, th = 46;
    criteria.forEach((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const tx = mx + col * (tw + 10), ty = y + row * (th + 8);
        doc.roundedRect(tx, ty, tw, th, 4).fill(C.white);
        doc.roundedRect(tx, ty, tw, th, 4)
            .lineWidth(0.5).strokeColor(C.border).stroke();
        doc.rect(tx, ty, 3, th).fill(C.gold);
        doc.fontSize(7).fillColor(C.gold).font('Helvetica-Bold')
            .text(c.label.toUpperCase(), tx + 12, ty + 9, { characterSpacing: 0.5 });
        doc.fontSize(12).fillColor(C.txt).font('Helvetica-Bold')
            .text(c.value, tx + 12, ty + 22, { width: tw - 22, lineBreak: false });
    });
    y += Math.ceil(criteria.length / 2) * (th + 8) + 10;

    const locs = parseArr(requirements.preferredLocations);
    if (locs?.length) {
        doc.fontSize(8).fillColor(C.txtSub).font('Helvetica').text('Preferred Locations', mx, y);
        y += 14;
        y = drawChips(doc, locs, mx, y, cw, C.black, C.goldPale, C.gold) + 10;
    }

    const types = parseArr(requirements.preferredTypes);
    if (types?.length) {
        doc.fontSize(8).fillColor(C.txtSub).font('Helvetica').text('Property Types', mx, y);
        y += 14;
        y = drawChips(doc, types, mx, y, cw, C.txtMed, C.offWhite, C.border) + 10;
    }

    y += 6;
    doc.rect(mx, y, cw, 0.5).fill(C.border);
    y += 16;

    sectionLabel(doc, 'RESULTS SUMMARY', mx, y);
    y += 18;

    const stats = [
        { n: summary?.totalMatches || 0,     label: 'Total Matches' },
        { n: summary?.excellentMatches || 0, label: 'Excellent (90%+)' },
        { n: summary?.goodMatches || 0,      label: 'Good (75%+)' },
        { n: shortCur(summary?.priceRange?.avg || 0), label: 'Avg. Price' },
    ];

    const sw = (cw - 18) / 4;
    stats.forEach((s, i) => {
        const sx = mx + i * (sw + 6);
        doc.roundedRect(sx, y, sw, 82, 5).fill(C.white);
        doc.roundedRect(sx, y, sw, 82, 5)
            .lineWidth(0.5).strokeColor(C.border).stroke();
        doc.rect(sx, y, sw, 3).fill(C.gold);

        const isNum = typeof s.n === 'number';
        doc.fontSize(isNum ? 30 : 13).fillColor(C.gold).font('Helvetica-Bold')
            .text(String(s.n), sx, y + 14, { width: sw, align: 'center' });
        doc.fontSize(8).fillColor(C.txtSub).font('Helvetica')
            .text(s.label, sx, y + 62, { width: sw, align: 'center' });
    });
    y += 98;

    if ((summary?.excellentMatches || 0) > 0) {
        doc.roundedRect(mx, y, cw, 50, 5).fill(C.goldPale);
        doc.roundedRect(mx, y, cw, 50, 5)
            .lineWidth(0.5).strokeColor(C.border).stroke();
        doc.rect(mx, y, 3, 50).fill(C.gold);
        doc.fontSize(11).fillColor(C.goldDk).font('Helvetica-Bold')
            .text(`${summary.excellentMatches} Excellent Match${summary.excellentMatches > 1 ? 'es' : ''} Found!`, mx + 14, y + 10);
        doc.fontSize(9.5).fillColor(C.txtMed).font('Helvetica')
            .text('These properties meet 90% or more of your stated requirements.',
                mx + 14, y + 28, { width: cw - 22 });
    }
}

// ═══════════════════════════════════════════════════════
// PAGE 3 — SCORECARD
// ═══════════════════════════════════════════════════════
function pageScorecard(doc, results) {
    if (!results?.length) return;

    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width;

    doc.rect(0, 0, W, doc.page.height).fill(C.cream);
    doc.rect(0, 0, W, 68).fill(C.black);
    doc.rect(0, 68, W, 2).fill(C.gold);
    doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
        .text('03  ·  SCORECARD', 52, 18, { characterSpacing: 1 });
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
        .text('Property Scorecard', 52, 33);
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

    let y = 84;
    const mx = 52, cw = W - mx * 2;

    results.slice(0, 10).forEach((result, idx) => {
        const cardH = 64;
        if (y + cardH > 762) {
            doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
            doc.rect(0, 0, W, doc.page.height).fill(C.cream);
            doc.rect(0, 0, W, 68).fill(C.black);
            doc.rect(0, 68, W, 2).fill(C.gold);
            doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
                .text('03  ·  SCORECARD (CONT.)', 52, 18, { characterSpacing: 1 });
            doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
                .text('Property Scorecard', 52, 33);
            y = 84;
        }

        const unit = result.unit, compound = unit?.compound || {}, dev = compound?.developer || {};
        const mc = matchCol(result.matchPercentage);
        const isTop = idx === 0;

        // Card
        doc.roundedRect(mx, y, cw, cardH, 5).fill(isTop ? C.black2 : C.white);
        doc.roundedRect(mx, y, cw, cardH, 5)
            .lineWidth(isTop ? 1 : 0.5)
            .strokeColor(isTop ? C.gold : C.border).stroke();

        // Left color strip
        doc.save();
        doc.rect(mx, y, 4, cardH).clip();
        doc.roundedRect(mx, y, 4, cardH, 2).fill(mc);
        doc.restore();

        // Rank
        const rankX = mx + 16;
        if (isTop) {
            doc.roundedRect(rankX, y + (cardH - 22) / 2, 34, 22, 4).fill(C.gold);
            doc.fontSize(7.5).fillColor(C.black).font('Helvetica-Bold')
                .text('TOP', rankX, y + (cardH - 22) / 2 + 7, { width: 34, align: 'center' });
        } else {
            doc.fontSize(18).fillColor(idx < 3 ? C.gold : C.txtMute).font('Helvetica-Bold')
                .text(String(idx + 1).padStart(2, '0'), rankX, y + 20, { width: 34, align: 'center' });
        }

        // Property info
        const infoX = mx + 62;
        const nameCol = isTop ? C.white : C.txt;
        const subCol  = isTop ? C.txtMute : C.txtSub;
        doc.fontSize(11).fillColor(nameCol).font('Helvetica-Bold')
            .text(compound.name || '—', infoX, y + 10, { width: 170, lineBreak: false });
        doc.fontSize(8.5).fillColor(subCol).font('Helvetica')
            .text(`${dev.name || '—'}  ·  ${compound.location || '—'}`, infoX, y + 26, { width: 170 });

        // Type badge
        const typeW = doc.fontSize(7.5).widthOfString(cap(unit.type || '—')) + 12;
        doc.roundedRect(infoX, y + 44, typeW, 13, 3)
            .fill(isTop ? C.black4 : C.offWhite);
        doc.fontSize(7.5).fillColor(isTop ? C.gold : C.txtSub).font('Helvetica')
            .text(cap(unit.type || '—'), infoX, y + 47, { width: typeW, align: 'center' });

        // Specs inline
        const specsX = mx + 246;
        const specs = [
            `${unit.bedrooms || '—'} Bed`,
            `${unit.bathrooms || '—'} Bath`,
            `${unit.area || '—'} sqm`,
            unit.floor ? `Fl. ${unit.floor}` : null,
        ].filter(Boolean);

        specs.forEach((sp, si) => {
            const spX = specsX + si * 54;
            if (spX + 48 > mx + cw - 100) return;
            doc.fontSize(8).fillColor(isTop ? C.txtSub : C.txtSub).font('Helvetica')
                .text(sp, spX, y + 14, { lineBreak: false });
        });
        doc.fontSize(7.5).fillColor(isTop ? C.txtMute : C.txtMute).font('Helvetica')
            .text(fmtFin(unit.finishingType), specsX, y + 30, { lineBreak: false });

        // Price
        const priceX = W - mx - 140;
        doc.fontSize(12).fillColor(isTop ? C.gold : C.goldDk).font('Helvetica-Bold')
            .text(shortCur(unit.price), priceX, y + 10, { width: 80, align: 'right', lineBreak: false });
        const ppsqm = unit.pricePerSqm || (unit.price && unit.area ? unit.price / unit.area : 0);
        doc.fontSize(8).fillColor(C.txtMute).font('Helvetica')
            .text(`${shortCur(ppsqm)}/sqm`, priceX, y + 28, { width: 80, align: 'right' });

        // Score pill
        const pillX = W - mx - 52;
        doc.roundedRect(pillX, y + 10, 48, 44, 6).fill(mc);
        doc.fontSize(17).fillColor(C.black).font('Helvetica-Bold')
            .text(`${result.matchPercentage}`, pillX, y + 14, { width: 48, align: 'center' });
        doc.fontSize(7.5).fillColor(C.black3).font('Helvetica')
            .text('%', pillX, y + 34, { width: 48, align: 'center' });

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

    doc.rect(0, 0, W, doc.page.height).fill(C.cream);
    doc.rect(0, 0, W, 68).fill(C.black);
    doc.rect(0, 68, W, 2).fill(C.gold);
    doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
        .text('04  ·  TOP PICKS', 52, 18, { characterSpacing: 1 });
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
        .text('Top Recommended Properties', 52, 33);
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

    let y = 82;
    const mx = 52, cw = W - mx * 2;

    topResults.forEach((result, idx) => {
        const bannerH = 54, bodyH = 106, cardH = bannerH + bodyH;
        if (y + cardH > 762) {
            doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
            doc.rect(0, 0, W, doc.page.height).fill(C.cream);
            doc.rect(0, 0, W, 68).fill(C.black);
            doc.rect(0, 68, W, 2).fill(C.gold);
            doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
                .text('Top Properties (cont.)', 52, 33);
            y = 82;
        }

        const unit = result.unit, compound = unit?.compound || {}, dev = compound?.developer || {};
        const mc = matchCol(result.matchPercentage);
        const isTop = idx === 0;

        // Card shell
        doc.roundedRect(mx, y, cw, cardH, 7).fill(C.white);
        doc.roundedRect(mx, y, cw, cardH, 7)
            .lineWidth(isTop ? 1.5 : 0.5).strokeColor(isTop ? C.gold : C.border).stroke();

        // Banner (black)
        doc.save();
        doc.rect(mx, y, cw, bannerH).clip();
        doc.roundedRect(mx, y, cw, bannerH, 7).fill(C.black);
        doc.restore();

        // Thin gold rule below banner
        doc.rect(mx, y + bannerH - 1, cw, 1).fill(C.gold);

        // Rank chip
        const rankChipW = isTop ? 74 : 30;
        doc.roundedRect(mx + 14, y + 15, rankChipW, 22, 4).fill(C.gold);
        doc.fontSize(isTop ? 8 : 11).fillColor(C.black).font('Helvetica-Bold')
            .text(isTop ? 'TOP PICK' : `#${idx + 1}`, mx + 14, y + 21, { width: rankChipW, align: 'center' });

        // Score on right of banner
        doc.fontSize(26).fillColor(C.gold).font('Helvetica-Bold')
            .text(`${result.matchPercentage}%`, mx + cw - 92, y + 8, { width: 78, align: 'right' });
        doc.fontSize(7.5).fillColor(C.txtMute).font('Helvetica')
            .text('MATCH', mx + cw - 92, y + 38, { width: 78, align: 'right' });

        // Property name + developer in banner
        const nameX = mx + 14 + rankChipW + 12;
        doc.fontSize(13).fillColor(C.white).font('Helvetica-Bold')
            .text(compound.name || '—', nameX, y + 10, { width: cw - rankChipW - 122, lineBreak: false });
        doc.fontSize(9).fillColor(C.txtMute).font('Helvetica')
            .text(`${dev.name || '—'}  ·  ${compound.location || '—'}`, nameX, y + 30, { width: cw - rankChipW - 122, lineBreak: false });

        // Body
        const bodyY = y + bannerH;

        // 6 spec boxes
        const specDefs = [
            { l: 'Beds',   v: String(unit.bedrooms || '—') },
            { l: 'Baths',  v: String(unit.bathrooms || '—') },
            { l: 'Area',   v: `${unit.area || '—'}m²` },
            { l: 'Floor',  v: unit.floor ? `Fl.${unit.floor}` : '—' },
            { l: 'View',   v: cap(unit.view || '—') },
            { l: 'Finish', v: abrvFin(unit.finishingType) },
        ];
        const sbW = (cw - 10) / 6;
        specDefs.forEach((s, si) => {
            const sx = mx + si * (sbW + 2);
            doc.roundedRect(sx, bodyY + 8, sbW, 36, 3).fill(C.offWhite);
            doc.roundedRect(sx, bodyY + 8, sbW, 36, 3)
                .lineWidth(0.5).strokeColor(C.border).stroke();
            if (isTop) {
                doc.rect(sx, bodyY + 8, sbW, 2).fill(C.gold);
            }
            doc.fontSize(6.5).fillColor(C.gold).font('Helvetica-Bold')
                .text(s.l, sx, bodyY + 13, { width: sbW, align: 'center' });
            doc.fontSize(11).fillColor(C.txt).font('Helvetica-Bold')
                .text(s.v, sx, bodyY + 24, { width: sbW, align: 'center' });
        });

        // Price row
        const priceY = bodyY + 52;
        doc.fontSize(14).fillColor(C.goldDk).font('Helvetica-Bold')
            .text(fullCur(unit.price), mx + 4, priceY, { lineBreak: false });
        const ppsqm = unit.pricePerSqm || (unit.price && unit.area ? unit.price / unit.area : 0);
        doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
            .text(`${shortCur(ppsqm)}/sqm`, mx + 180, priceY + 2, { lineBreak: false });

        // Mini score bars
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

    doc.rect(0, 0, W, doc.page.height).fill(C.cream);
    doc.rect(0, 0, W, 68).fill(C.black);
    doc.rect(0, 68, W, 2).fill(C.gold);
    doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
        .text('05  ·  COMPARISON', 52, 18, { characterSpacing: 1 });
    doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold')
        .text('Top 3 Side-by-Side', 52, 33);
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text('REALESTATE PRO', W - 170, 30, { width: 118, align: 'right' });

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

        doc.roundedRect(cx, y, colW, 68, 5).fill(C.black);
        doc.roundedRect(cx, y, colW, 68, 5)
            .lineWidth(isTop ? 1.5 : 0.5).strokeColor(isTop ? C.gold : C.borderDk).stroke();
        doc.rect(cx, y, colW, 3).fill(isTop ? C.gold : mc);

        if (isTop) {
            doc.roundedRect(cx + 8, y + 8, 66, 18, 3).fill(C.gold);
            doc.fontSize(7.5).fillColor(C.black).font('Helvetica-Bold')
                .text('TOP PICK', cx + 8, y + 13, { width: 66, align: 'center' });
        }
        doc.fontSize(isTop ? 10 : 11).fillColor(C.white).font('Helvetica-Bold')
            .text(r.unit?.compound?.name || `Property ${i + 1}`, cx + 6, isTop ? y + 32 : y + 20, { width: colW - 12, align: 'center' });
        doc.fontSize(9).fillColor(mc).font('Helvetica-Bold')
            .text(`${r.matchPercentage}% match`, cx, isTop ? y + 52 : y + 44, { width: colW, align: 'center' });
    });
    y += 76;

    // Attribute rows
    const attrs = [
        { label: 'Location',   get: r => r.unit?.compound?.location || '—' },
        { label: 'Type',       get: r => cap(r.unit?.type || '—') },
        { label: 'Bedrooms',   get: r => String(r.unit?.bedrooms || '—'), num: r => r.unit?.bedrooms || 0,  best: 'high' },
        { label: 'Bathrooms',  get: r => String(r.unit?.bathrooms || '—'), num: r => r.unit?.bathrooms || 0, best: 'high' },
        { label: 'Area (sqm)', get: r => `${r.unit?.area || '—'}`,         num: r => r.unit?.area || 0,      best: 'high' },
        { label: 'Price',      get: r => shortCur(r.unit?.price),           num: r => r.unit?.price || 0,    best: 'low' },
        { label: '/sqm',       get: r => shortCur(r.unit?.pricePerSqm || (r.unit?.price && r.unit?.area ? r.unit.price / r.unit.area : 0)),
                               num: r => r.unit?.pricePerSqm || (r.unit?.price && r.unit?.area ? r.unit.price / r.unit.area : 0), best: 'low' },
        { label: 'Finishing',  get: r => fmtFin(r.unit?.finishingType) },
        { label: 'Floor',      get: r => r.unit?.floor ? `Floor ${r.unit.floor}` : '—' },
        { label: 'View',       get: r => cap(r.unit?.view || '—') },
        { label: 'Match',      get: r => `${r.matchPercentage}%`,           num: r => r.matchPercentage,      best: 'high' },
    ];

    const rowH = 26;
    attrs.forEach((attr, ai) => {
        const rowBg = ai % 2 === 0 ? C.white : C.offWhite;
        doc.rect(mx, y, cw, rowH).fill(rowBg);

        doc.fontSize(8).fillColor(C.txtSub).font('Helvetica-Bold')
            .text(attr.label, mx + 4, y + 9);

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
                doc.rect(cx + 2, y + 2, colW - 4, rowH - 4).fill(C.goldPale);
            }
            doc.fontSize(9)
                .fillColor(isBest ? C.goldDk : C.txtMed)
                .font(isBest ? 'Helvetica-Bold' : 'Helvetica')
                .text(val + (isBest ? ' ★' : ''), cx + 4, y + 9, { width: colW - 8, align: 'center', lineBreak: false });
        });

        doc.rect(mx, y + rowH - 0.5, cw, 0.5).fill(C.border);
        y += rowH;
    });

    doc.roundedRect(mx, 82 + 76, cw, y - 82 - 76, 4)
        .lineWidth(0.5).strokeColor(C.border).stroke();

    y += 10;
    doc.fontSize(8.5).fillColor(C.gold).font('Helvetica-Bold')
        .text('★', mx, y, { lineBreak: false });
    doc.fontSize(8.5).fillColor(C.txtSub).font('Helvetica')
        .text('  Best value in category', mx + 12, y);
}

// ═══════════════════════════════════════════════════════
// PAGE 6 — RECOMMENDATION (split layout)
// ═══════════════════════════════════════════════════════
function pageRecommendation(doc, topResult, requirements) {
    if (!topResult) return;

    doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const W = doc.page.width, H = doc.page.height;

    const unit = topResult.unit, compound = unit?.compound || {}, dev = compound?.developer || {};

    // ── Left black panel (44%) ──
    const leftW = Math.round(W * 0.44);
    doc.rect(0, 0, leftW, H).fill(C.black);

    // Gold top accent strip
    doc.rect(0, 0, leftW, 4).fill(C.gold);

    // Decorative subtle circles on left panel
    doc.save();
    doc.circle(leftW * 0.5, H * 0.82, 130).lineWidth(0.5).strokeColor(C.goldRule).stroke();
    doc.circle(leftW * 0.5, H * 0.82, 95).lineWidth(0.3).strokeColor(C.goldRule).stroke();
    doc.restore();

    // Page label
    doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
        .text('06  ·  RECOMMENDATION', 22, 18, { characterSpacing: 1 });

    // "#1 Recommended" — outlined badge
    doc.roundedRect(22, 38, 122, 22, 4)
        .lineWidth(1).strokeColor(C.gold).stroke();
    doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
        .text('#1 RECOMMENDED', 22, 44, { width: 122, align: 'center' });

    // Score ring
    const ringCX = leftW / 2, ringCY = 192;
    bigRing(doc, ringCX, ringCY, 58, topResult.matchPercentage, C.gold);

    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text('MATCH SCORE', 0, ringCY + 72, { width: leftW, align: 'center' });

    // Property name
    doc.fontSize(15).fillColor(C.white).font('Helvetica-Bold')
        .text(compound.name || '—', 14, ringCY + 90, { width: leftW - 28, align: 'center' });
    doc.fontSize(9).fillColor(C.txtSub).font('Helvetica')
        .text(`${cap(unit.type || '—')} by ${dev.name || '—'}`, 14, ringCY + 114, { width: leftW - 28, align: 'center' });
    doc.fontSize(8.5).fillColor(C.txtMute).font('Helvetica')
        .text(compound.location || '—', 14, ringCY + 132, { width: leftW - 28, align: 'center' });

    // Thin gold rule
    doc.rect(22, ringCY + 156, leftW - 44, 0.5).fill(C.gold);

    // Why this property
    doc.fontSize(8).fillColor(C.gold).font('Helvetica-Bold')
        .text('WHY THIS PROPERTY', 22, ringCY + 170, { characterSpacing: 1 });

    const reasons = [];
    if (topResult.matchPercentage >= 90) reasons.push('Excellent overall — meets 90%+ of requirements');
    if (topResult.highlights?.highlights) reasons.push(...topResult.highlights.highlights.slice(0, 3));
    if (!reasons.length) reasons.push('Best overall match for your stated criteria');

    let ry = ringCY + 190;
    reasons.forEach(r => {
        doc.rect(22, ry + 5, 3, 3).fill(C.gold);
        doc.fontSize(8.5).fillColor(C.txtSub).font('Helvetica')
            .text(r, 32, ry, { width: leftW - 50, lineBreak: true });
        ry += 22;
    });

    // ── Right cream panel ──
    const rightX = leftW;
    const rightW = W - leftW;
    doc.rect(rightX, 0, rightW, H).fill(C.cream);
    doc.rect(rightX, 0, 1, H).fill(C.border);
    doc.rect(rightX, 0, rightW, 4).fill(C.gold);

    // Section header
    doc.fontSize(11).fillColor(C.txt).font('Helvetica-Bold')
        .text('Property Details', rightX + 24, 22);
    doc.rect(rightX + 24, 42, rightW - 48, 0.5).fill(C.border);

    // Spec grid 2×3
    const specs = [
        { l: 'Bedrooms',  v: String(unit.bedrooms || '—') },
        { l: 'Bathrooms', v: String(unit.bathrooms || '—') },
        { l: 'Area',      v: `${unit.area || '—'} sqm` },
        { l: 'Floor',     v: unit.floor ? `Floor ${unit.floor}` : '—' },
        { l: 'View',      v: cap(unit.view || '—') },
        { l: 'Finishing', v: fmtFin(unit.finishingType) },
    ];
    const sbW = (rightW - 60) / 3, sbH = 52;
    specs.forEach((s, i) => {
        const row = Math.floor(i / 3), col = i % 3;
        const sx = rightX + 24 + col * (sbW + 6);
        const sy = 50 + row * (sbH + 8);
        doc.roundedRect(sx, sy, sbW, sbH, 4).fill(C.white);
        doc.roundedRect(sx, sy, sbW, sbH, 4)
            .lineWidth(0.5).strokeColor(C.border).stroke();
        doc.rect(sx, sy, sbW, 2).fill(C.gold);
        doc.fontSize(7).fillColor(C.gold).font('Helvetica-Bold')
            .text(s.l.toUpperCase(), sx, sy + 9, { width: sbW, align: 'center' });
        doc.fontSize(13).fillColor(C.txt).font('Helvetica-Bold')
            .text(s.v, sx, sy + 25, { width: sbW, align: 'center' });
    });

    // Price block
    const priceY = 50 + 2 * (sbH + 8) + 10;
    doc.roundedRect(rightX + 24, priceY, rightW - 48, 58, 5).fill(C.black);
    doc.rect(rightX + 24, priceY, rightW - 48, 2).fill(C.gold);
    doc.fontSize(8.5).fillColor(C.gold).font('Helvetica-Bold')
        .text('TOTAL PRICE', rightX + 38, priceY + 10, { characterSpacing: 1 });
    doc.fontSize(20).fillColor(C.white).font('Helvetica-Bold')
        .text(fullCur(unit.price), rightX + 38, priceY + 26);
    const ppsqm = unit.price && unit.area ? unit.price / unit.area : 0;
    doc.fontSize(10).fillColor(C.gold).font('Helvetica-Bold')
        .text(`${shortCur(ppsqm)}/sqm`, rightX + 24, priceY + 30, { width: rightW - 48, align: 'right' });

    // Score breakdown
    const scoresY = priceY + 72;
    doc.fontSize(9).fillColor(C.txt).font('Helvetica-Bold')
        .text('Score Breakdown', rightX + 24, scoresY);

    const scoreEntries = Object.entries(topResult.scores || {});
    scoreEntries.forEach(([key, val], i) => {
        const row = Math.floor(i / 2), col = i % 2;
        const bW = (rightW - 60) / 2;
        const bx = rightX + 24 + col * (bW + 12);
        const by = scoresY + 16 + row * 32;
        fullBar(doc, bx, by, bW, key, val, C.gold);
    });

    // CTA bar — full width
    const ctaH = 52;
    doc.rect(0, H - ctaH, W, ctaH).fill(C.black3);
    doc.rect(0, H - ctaH, W, 1).fill(C.gold);
    doc.fontSize(13).fillColor(C.gold).font('Helvetica-Bold')
        .text('Ready to Schedule a Viewing?', 52, H - ctaH + 12);
    doc.fontSize(9.5).fillColor(C.txtMute).font('Helvetica')
        .text('Contact us today to arrange a tour and learn more about this opportunity.',
            52, H - ctaH + 32, { width: W - 104 });
}

// ═══════════════════════════════════════════════════════
// FOOTERS
// ═══════════════════════════════════════════════════════
function addFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        const W = doc.page.width, H = doc.page.height;
        doc.rect(0, H - 24, W, 24).fill(C.black);
        doc.rect(0, H - 24, W, 0.5).fill(C.goldRule);
        doc.fontSize(7.5).fillColor(C.txtMute).font('Helvetica')
            .text('CONFIDENTIAL', 52, H - 14);
        doc.text(`Page ${i + 1} of ${range.count}`, 52, H - 14,
            { width: W - 104, align: 'center' });
        doc.text(new Date().toLocaleDateString(), W - 160, H - 14,
            { width: 108, align: 'right' });
    }
}

// ═══════════════════════════════════════════════════════
// DRAWING HELPERS
// ═══════════════════════════════════════════════════════

function bigRing(doc, cx, cy, r, pct, color) {
    const lw = 9;
    // Track circle
    doc.circle(cx, cy, r).lineWidth(lw).strokeColor(C.black4).stroke();
    // Filled arc
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
    doc.fontSize(28).fillColor(color).font('Helvetica-Bold')
        .text(`${pct}%`, cx - r, cy - 16, { width: r * 2, align: 'center' });
}

function miniBar(doc, x, y, w, label, score) {
    const pct = Math.max(0, Math.min(1, score || 0));
    const col = pct >= 0.9 ? C.gold : pct >= 0.75 ? C.goldDk : pct >= 0.6 ? C.amber : C.red;
    doc.fontSize(6.5).fillColor(C.txtMute).font('Helvetica')
        .text(label, x, y, { width: w, lineBreak: false });
    doc.roundedRect(x, y + 10, w, 5, 2).fill(C.offWhite);
    if (pct > 0) doc.roundedRect(x, y + 10, Math.max(4, Math.round(w * pct)), 5, 2).fill(col);
}

function fullBar(doc, x, y, w, label, score, accentCol = C.gold) {
    const pct = Math.max(0, Math.min(1, score || 0));
    const col = pct >= 0.9 ? C.gold : pct >= 0.75 ? accentCol : pct >= 0.6 ? C.amber : C.red;
    const lbl = label.charAt(0).toUpperCase() + label.slice(1);
    doc.fontSize(8.5).fillColor(C.txtSub).font('Helvetica').text(lbl, x, y + 2, { width: 60, lineBreak: false });
    const bx = x + 64, bw = w - 90;
    doc.roundedRect(bx, y + 5, bw, 7, 3).fill(C.offWhite);
    if (pct > 0) doc.roundedRect(bx, y + 5, Math.max(4, Math.round(bw * pct)), 7, 3).fill(col);
    doc.fontSize(9).fillColor(col).font('Helvetica-Bold')
        .text(`${Math.round(pct * 100)}%`, bx + bw + 4, y + 2, { width: 28 });
}

function drawChips(doc, items, startX, y, maxW, textCol, bgCol, borderCol) {
    let cx = startX;
    const pH = 20;
    items.forEach(item => {
        const iw = doc.fontSize(8.5).widthOfString(item) + 18;
        if (cx + iw > startX + maxW) { cx = startX; y += pH + 5; }
        doc.roundedRect(cx, y, iw, pH, 4).fill(bgCol);
        if (borderCol) {
            doc.roundedRect(cx, y, iw, pH, 4).lineWidth(0.5).strokeColor(borderCol).stroke();
        }
        doc.fontSize(8.5).fillColor(textCol).font('Helvetica-Bold')
            .text(item, cx, y + 6, { width: iw, align: 'center' });
        cx += iw + 6;
    });
    return y + pH;
}

function sectionLabel(doc, text, x, y) {
    doc.fontSize(7.5).fillColor(C.gold).font('Helvetica-Bold')
        .text(text, x, y, { characterSpacing: 1 });
}

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════
function matchCol(pct) {
    if (pct >= 90) return C.gold;
    if (pct >= 75) return C.goldDk;
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
