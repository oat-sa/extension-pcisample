<?php

/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2022-2023 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\pciSamples\model\LegacyPciHelper;

use oat\taoQtiItem\model\qti\interaction\Interaction;
use oat\taoQtiItem\model\qti\interaction\PortableCustomInteraction;

class TextReaderLegacyDetection
{
    private const IMAGE_ATTRIBUTE_SUBSTRING = '<img';
    private const TEXT_READER_TYPE_IDENTIFIER = 'textReaderInteraction';

    public function isTextReaderWithImage(Interaction $interaction): bool
    {
        $interactionProperties = $interaction->getProperties();
        return $this->isLegacyTextReader($interaction) &&
            isset($interactionProperties['pages']) &&
            $this->isPagesContainsImages($interactionProperties['pages']);
    }

    public function isLegacyTextReader(Interaction $interaction): bool
    {
        return $interaction instanceof PortableCustomInteraction &&
            $interaction->getTypeIdentifier() === static::TEXT_READER_TYPE_IDENTIFIER;
    }

    private function isPagesContainsImages(array $pages): bool
    {
        foreach ($pages as $page) {
            if ($this->pageContentHasImage($page['content'])) {
                return true;
            }
        }
        return false;
    }

    private function pageContentHasImage(array $content): bool
    {
        return !empty(array_filter($content, function ($var) {
            return false !== strrpos($var, self::IMAGE_ATTRIBUTE_SUBSTRING);
        }));
    }
}
