<?php
/*
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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 *
 */

namespace oat\pciSamples\model\update;

use oat\taoQtiItem\model\update\ItemUpdater;
use oat\taoQtiItem\model\qti\Item;
use oat\taoQtiItem\model\qti\Value;
use oat\taoQtiItem\model\qti\interaction\PortableCustomInteraction;

/**
 * Description of ItemFixTextReaderDefaultValue
 *
 * @author sam
 */
class ItemFixTextReaderDefaultValue extends ItemUpdater
{
    /**
     * Remove unused response declaration from the items and rp template misuse
     *
     * @param oat\taoQtiItem\modal\Item $item
     * @param string $itemFile
     * @return boolean
     */
    protected function updateItem(Item $item, $itemFile)
    {
        $changed = false;
        $requireFix = false;
        $interactions = $item->getInteractions();
        foreach ($interactions as $interaction) {
            if ($interaction instanceof PortableCustomInteraction && $interaction->getTypeIdentifier() === 'textReaderInteraction') {

                $response = $interaction->getResponse();
                $currentDefaultVal = $response->getDefaultValue();

                if(!is_array($currentDefaultVal) || empty($currentDefaultVal) || count($currentDefaultVal) !== 1){
                    $requireFix = true;
                }else{
                    $val = $currentDefaultVal[0];
                    $requireFix = !($val instanceof Value && $val->getValue() === 'true');
                }

                if($requireFix){
                    $defaultValue = new Value();
                    $defaultValue->setValue('true');
                    $response->setDefaultValue([$defaultValue]);
                    $changed = true;
                }
            }
        }
        return $changed;
    }
}