// routes/grammar.js - Grammar checking routes
const express = require('express');
const { body, validationResult } = require('express-validator');
const LanguageToolService = require('../services/languageToolService');
const db = require('../db/database');

const router = express.Router();
const languageToolService = new LanguageToolService();

// Middleware to track request time
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Validation rules
const checkGrammarValidation = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text must be between 1 and 10,000 characters'),
  body('language')
    .optional()
    .isIn(['en-US', 'en-GB', 'vi', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'])
    .withMessage('Invalid language code'),
  body('user_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('title')
    .optional()
    .isString()
];

// POST /api/grammar/check - Check and save grammar results
router.post('/check', checkGrammarValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { text, language = 'en-US', user_id = 1, title = 'Untitled Document' } = req.body;
    const sanitizedText = text.replace(/[<>]/g, '');

    // Call LanguageTool API
    const result = await languageToolService.checkGrammar(sanitizedText, language);
    const grammarMatches = result.matches || [];

    // Step 1: Save document
    db.run(
      `INSERT INTO Document (user_id, title, content, language_code) VALUES (?, ?, ?, ?)`,
      [user_id, title, sanitizedText, language],
      function (err) {
        if (err) {
          console.error('DB Insert Document Error:', err);
          return res.status(500).json({ success: false, error: 'Failed to save document' });
        }

        const docId = this.lastID;

        // Step 2: Insert suggestions and grammar errors
        const insertSug = db.prepare(
          `INSERT INTO Suggestion (replacement_text, description) VALUES (?, ?)`
        );
        const insertErr = db.prepare(
          `INSERT INTO GrammarError (doc_id, sentence, error_text, explanation, suggestion_id)
           VALUES (?, ?, ?, ?, ?)`
        );

        grammarMatches.forEach(match => {
          const sentence = sanitizedText.substring(match.offset, match.offset + match.length);
          const errorText = match.context?.text || '';
          const explanation = match.message || '';
          const replacement = match.replacements?.[0]?.value || '';
          const description = match.rule?.description || '';

          insertSug.run([replacement, description], function (err) {
            const suggestionId = this.lastID || null;
            insertErr.run([docId, sentence, errorText, explanation, suggestionId]);
          });
        });

        // Step 3: Return response
        const processedResult = {
          ...result,
          statistics: {
            totalErrors: grammarMatches.length,
            errorTypes: languageToolService.categorizeErrors(grammarMatches),
            processingTime: Date.now() - req.startTime
          }
        };

        res.json({
          success: true,
          data: processedResult,
          timestamp: new Date().toISOString()
        });
      }
    );
  } catch (error) {
    console.error('Grammar check error:', error);

    if (error.name === 'LanguageToolError') {
      return res.status(503).json({
        success: false,
        error: 'Grammar checking service temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to check grammar'
    });
  }
});

// GET /api/grammar/languages - Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      languages: [
        { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
        { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Português', flag: '🇵🇹' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: '한국어', flag: '🇰🇷' }
      ]
    }
  });
});

module.exports = router;
