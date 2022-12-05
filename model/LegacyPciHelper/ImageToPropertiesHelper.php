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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\pciSamples\model\LegacyPciHelper;

use Exception;
use oat\oatbox\filesystem\Directory;
use oat\taoMediaManager\model\fileManagement\FileManagement;
use oat\taoMediaManager\model\MediaSource;

class ImageToPropertiesHelper
{
    /** @var MediaSource */
    private $mediaSource;

    /** @var FileManagement */
    private $fileManagement;

    public function __construct(MediaSource $mediaSource, FileManagement $fileManagement)
    {
        $this->mediaSource = $mediaSource;
        $this->fileManagement = $fileManagement;
    }

    public function addImagesToProperties(array $images, array $properties, Directory $itemDirectory): array
    {
        foreach ($images as $image) {
            if ($this->isImageMediaManager($image['fileName'])) {
                $fileInfo = $this->mediaSource->getFileInfo($image['fileName']);

                $data = $this->fileManagement->getFileStream(
                    $fileInfo['link']
                )->getContents();
            } else {
                $data = $itemDirectory->getFile($image['fileName'])->read();
            }

            if (!is_string($data)) {
                throw new Exception(sprintf('Failed to get data: %s', $image['fileName']));
            }

            $properties = $this->addBase64Image(
                $properties,
                $image['fileName'],
                $data
            );
        }

        return $properties;
    }

    private function addBase64Image(array $properties, string $fileName, string $image): array
    {
        $properties['content-' . $fileName] = sprintf(
            "data:image/png;base64,%s",
            base64_encode($image)
        );

        return $properties;
    }

    private function isImageMediaManager(string $fileName): bool
    {
        return false !== strpos($fileName, 'taomedia://');
    }
}
