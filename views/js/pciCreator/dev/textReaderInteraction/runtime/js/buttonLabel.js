/**
 * SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

/**
 * Prepare Text Reader navigation button labels for safe HTML rendering.
 * Converts {ruby} placeholders and keeps only ruby/rt/rb/rp markup.
 */
define([], function () {
    'use strict';

    var rubyPlaceholders = /\{(ruby|rt|rb|rp)\}|\{\/(ruby|rt|rb|rp)\}/g;
    var allowedRubyTags = {
        ruby: true,
        rt: true,
        rb: true,
        rp: true
    };

    /**
     * Converts ruby placeholder tags to HTML elements.
     *
     * @param {String} text
     * @returns {String}
     */
    function convertRubyTags(text) {
        return String(text).replace(rubyPlaceholders, function (match, open, close) {
            return open ? '<' + open + '>' : '</' + close + '>';
        });
    }

    /**
     * Escapes HTML special characters.
     *
     * @param {String} text
     * @returns {String}
     */
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Serializes a DOM subtree keeping only ruby-related elements and text.
     *
     * @param {Node} node
     * @returns {String}
     */
    function serializeAllowedNodes(node) {
        var result = '';
        var child;
        var tag;

        for (child = node.firstChild; child; child = child.nextSibling) {
            if (child.nodeType === Node.TEXT_NODE) {
                result += escapeHtml(child.nodeValue);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                tag = child.tagName.toLowerCase();
                if (allowedRubyTags[tag]) {
                    result += '<' + tag + '>' + serializeAllowedNodes(child) + '</' + tag + '>';
                } else {
                    result += serializeAllowedNodes(child);
                }
            }
        }

        return result;
    }

    /**
     * Parses HTML with DOMParser and keeps only safe ruby markup.
     *
     * @param {String} html
     * @returns {String}
     */
    function sanitizeRubyHtml(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');

        if (!doc.body) {
            return '';
        }

        return serializeAllowedNodes(doc.body);
    }

    /**
     * Converts ruby placeholders and keeps only safe ruby markup in a button label.
     *
     * @param {*} label
     * @returns {String}
     */
    function prepareButtonLabel(label) {
        if (label === null || typeof label === 'undefined') {
            return '';
        }

        if (typeof label !== 'string') {
            return escapeHtml(label);
        }

        if (label === '') {
            return '';
        }

        return sanitizeRubyHtml(convertRubyTags(label));
    }

    return {
        convertRubyTags: convertRubyTags,
        escapeHtml: escapeHtml,
        prepareButtonLabel: prepareButtonLabel
    };
});
