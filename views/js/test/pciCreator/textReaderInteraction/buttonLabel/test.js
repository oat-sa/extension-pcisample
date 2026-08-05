/**
 * SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */
define([
    'pciSamples/pciCreator/ims/textReaderInteraction/runtime/js/buttonLabel',
    'pciSamples/pciCreator/dev/textReaderInteraction/runtime/js/buttonLabel'
], function (imsButtonLabel, devButtonLabel) {
    'use strict';

    var modules = [
        { name: 'ims', api: imsButtonLabel },
        { name: 'dev', api: devButtonLabel }
    ];

    var cases = [
        {
            title: 'ruby placeholders',
            input: '{ruby}{rb}Page{/rb}{rt}test{/rt}{/ruby}',
            expected: '<ruby><rb>Page</rb><rt>test</rt></ruby>'
        },
        {
            title: 'permitted ruby tags',
            input: '<ruby><rb>基</rb><rt>き</rt><rp>(</rp><rp>)</rp></ruby>',
            expected: '<ruby><rb>基</rb><rt>き</rt><rp>(</rp><rp>)</rp></ruby>'
        },
        {
            title: 'stripped attributes',
            input: '<ruby onclick="alert(1)" class="x"><rb>a</rb><rt>b</rt></ruby>',
            expected: '<ruby><rb>a</rb><rt>b</rt></ruby>'
        },
        {
            title: 'non-ruby tags',
            input: '<b>Prev</b> <script>alert(1)</script>',
            expected: 'Prev alert(1)'
        },
        {
            title: 'entity escaping',
            input: 'A & B < C > "D" \'E\'',
            expected: 'A &amp; B &lt; C &gt; &quot;D&quot; &#39;E&#39;'
        },
        {
            title: 'malformed markup',
            input: '{ruby}{rb}x',
            expected: '<ruby><rb>x</rb></ruby>'
        },
        {
            title: 'null',
            input: null,
            expected: ''
        },
        {
            title: 'undefined',
            input: undefined,
            expected: ''
        },
        {
            title: 'non-string number',
            input: 42,
            expected: '42'
        },
        {
            title: 'empty string',
            input: '',
            expected: ''
        }
    ];

    QUnit.module('prepareButtonLabel');

    modules.forEach(function (module) {
        QUnit.test(module.name + ' exposes prepareButtonLabel', function (assert) {
            assert.equal(typeof module.api.prepareButtonLabel, 'function');
        });

        cases.forEach(function (data) {
            QUnit.test(module.name + ': ' + data.title, function (assert) {
                assert.equal(
                    module.api.prepareButtonLabel(data.input),
                    data.expected,
                    data.title
                );
            });
        });
    });

    QUnit.test('ims and dev share the same contract', function (assert) {
        cases.forEach(function (data) {
            assert.equal(
                imsButtonLabel.prepareButtonLabel(data.input),
                devButtonLabel.prepareButtonLabel(data.input),
                data.title
            );
        });
    });
});
