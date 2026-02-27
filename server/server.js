import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { compareUnits, generateComparisonSummary } from './services/comparisonEngine.js';
import { generateComparisonPDF } from './services/pdfGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';

// Ensure DATABASE_URL is set — Railway sets it via env vars; local dev falls back to server/ directory
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${path.join(__dirname, 'prisma/dev.db')}`;
}

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
    exposedHeaders: ['Content-Disposition', 'Content-Length']
}));
app.use(express.json());

// ============================================
// DEVELOPER ENDPOINTS
// ============================================

// Get all developers
app.get('/api/developers', async (req, res) => {
    try {
        const developers = await prisma.developer.findMany({
            include: {
                compounds: {
                    include: {
                        _count: { select: { units: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(developers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single developer
app.get('/api/developers/:id', async (req, res) => {
    try {
        const developer = await prisma.developer.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                compounds: {
                    include: {
                        units: true,
                        _count: { select: { units: true } }
                    }
                }
            }
        });
        if (!developer) {
            return res.status(404).json({ error: 'Developer not found' });
        }
        res.json(developer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create developer
app.post('/api/developers', async (req, res) => {
    try {
        const developer = await prisma.developer.create({
            data: req.body
        });
        res.status(201).json(developer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update developer
app.put('/api/developers/:id', async (req, res) => {
    try {
        const developer = await prisma.developer.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(developer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete developer
app.delete('/api/developers/:id', async (req, res) => {
    try {
        await prisma.developer.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================
// COMPOUND ENDPOINTS
// ============================================

// Get all compounds
app.get('/api/compounds', async (req, res) => {
    try {
        const { developerId } = req.query;
        const where = developerId ? { developerId: parseInt(developerId) } : {};

        const compounds = await prisma.compound.findMany({
            where,
            include: {
                developer: true,
                units: true,
                _count: { select: { units: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(compounds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single compound
app.get('/api/compounds/:id', async (req, res) => {
    try {
        const compound = await prisma.compound.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                developer: true,
                units: true
            }
        });
        if (!compound) {
            return res.status(404).json({ error: 'Compound not found' });
        }
        res.json(compound);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create compound
app.post('/api/compounds', async (req, res) => {
    try {
        const compound = await prisma.compound.create({
            data: req.body,
            include: { developer: true }
        });
        res.status(201).json(compound);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update compound
app.put('/api/compounds/:id', async (req, res) => {
    try {
        const compound = await prisma.compound.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
            include: { developer: true }
        });
        res.json(compound);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete compound
app.delete('/api/compounds/:id', async (req, res) => {
    try {
        await prisma.compound.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================
// UNIT ENDPOINTS
// ============================================

// Get all units
app.get('/api/units', async (req, res) => {
    try {
        const { compoundId, available } = req.query;
        const where = {};
        if (compoundId) where.compoundId = parseInt(compoundId);
        if (available !== undefined) where.available = available === 'true';

        const units = await prisma.unit.findMany({
            where,
            include: {
                compound: {
                    include: { developer: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single unit
app.get('/api/units/:id', async (req, res) => {
    try {
        const unit = await prisma.unit.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                compound: {
                    include: { developer: true }
                }
            }
        });
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create unit
app.post('/api/units', async (req, res) => {
    try {
        const data = { ...req.body };
        // Calculate price per sqm if not provided
        if (data.price && data.area && !data.pricePerSqm) {
            data.pricePerSqm = data.price / data.area;
        }

        const unit = await prisma.unit.create({
            data,
            include: {
                compound: { include: { developer: true } }
            }
        });
        res.status(201).json(unit);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update unit
app.put('/api/units/:id', async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.price && data.area) {
            data.pricePerSqm = data.price / data.area;
        }

        const unit = await prisma.unit.update({
            where: { id: parseInt(req.params.id) },
            data,
            include: {
                compound: { include: { developer: true } }
            }
        });
        res.json(unit);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete unit
app.delete('/api/units/:id', async (req, res) => {
    try {
        await prisma.unit.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ============================================
// CUSTOMER REQUIREMENTS ENDPOINTS
// ============================================

// Save requirements
app.post('/api/requirements', async (req, res) => {
    try {
        const requirement = await prisma.customerRequirement.create({
            data: req.body
        });
        res.status(201).json(requirement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all requirements
app.get('/api/requirements', async (req, res) => {
    try {
        const requirements = await prisma.customerRequirement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(requirements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// COMPARISON ENDPOINTS
// ============================================

// Run comparison
app.post('/api/compare', async (req, res) => {
    try {
        const requirements = req.body;

        // Get all available units with their compounds and developers
        const units = await prisma.unit.findMany({
            where: { available: true },
            include: {
                compound: {
                    include: { developer: true }
                }
            }
        });

        // Run comparison engine
        const results = compareUnits(units, requirements);
        const summary = generateComparisonSummary(results, requirements);

        // Save requirements if customer name provided
        let savedRequirement = null;
        if (requirements.customerName) {
            const dbData = { ...requirements };
            // Stringify array fields before saving (Prisma schema stores them as JSON strings)
            if (Array.isArray(dbData.preferredLocations)) dbData.preferredLocations = JSON.stringify(dbData.preferredLocations);
            if (Array.isArray(dbData.preferredTypes))    dbData.preferredTypes    = JSON.stringify(dbData.preferredTypes);
            if (Array.isArray(dbData.preferredViews))    dbData.preferredViews    = JSON.stringify(dbData.preferredViews);
            savedRequirement = await prisma.customerRequirement.create({ data: dbData });
        }

        res.json({
            requirementId: savedRequirement?.id,
            summary,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate PDF report
app.post('/api/reports/pdf', async (req, res) => {
    try {
        const { requirements, results, summary } = req.body;

        if (!requirements || !results) {
            return res.status(400).json({ error: 'Requirements and results are required' });
        }

        const pdfBuffer = await generateComparisonPDF(requirements, results, summary);

        // Generate filename
        const customerName = (requirements.customerName || 'report')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `comparison-report-${customerName}-${timestamp}.pdf`;

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DASHBOARD STATS
// ============================================

app.get('/api/stats', async (req, res) => {
    try {
        const [developers, compounds, units, requirements] = await Promise.all([
            prisma.developer.count(),
            prisma.compound.count(),
            prisma.unit.count(),
            prisma.customerRequirement.count()
        ]);

        const availableUnits = await prisma.unit.count({ where: { available: true } });

        const avgPrice = await prisma.unit.aggregate({
            _avg: { price: true },
            _min: { price: true },
            _max: { price: true }
        });

        res.json({
            developers,
            compounds,
            units,
            availableUnits,
            requirements,
            priceStats: avgPrice
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SERVE REACT BUILD (production)
// ============================================
if (IS_PROD) {
    const clientDist = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDist));
    // Catch-all: serve index.html for SPA routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// ============================================
// AUTO-SEED IF DATABASE IS EMPTY
// ============================================
async function seedIfEmpty() {
    try {
        const count = await prisma.developer.count();
        if (count > 0) return;

        console.log('Database empty — running seed...');
        const { default: seedFn } = await import('./prisma/seed.js');
        if (typeof seedFn === 'function') await seedFn();
        console.log('Seed complete.');
    } catch (err) {
        console.error('Seed error:', err.message);
    }
}

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await seedIfEmpty();
});
