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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA;
 *
 *
 */

namespace oat\pciSamples\scripts\update;

use oat\pciSamples\scripts\install\RegisterPciTextReader;
use oat\qtiItemPci\model\IMSPciModel;
use oat\taoQtiItem\model\HookRegistry;

class Updater extends \common_ext_ExtensionUpdater
{

    /**
     *
     * @param string $currentVersion
     * @return string $versionUpdatedTo
     */
    public function update($initialVersion)
    {

        if ($this->isBetween('0', '0.2.1')) {
            $this->setVersion('0.2.1');
        }

        if ($this->isVersion('0.2.1')) {

            HookRegistry::getRegistry()->remove('pciSamplesCreator');

            $this->setVersion('1.0.0');
        }

        $this->skip('1.0.0', '1.2.0');

        if ($this->isVersion('1.2.0')) {
            call_user_func(new RegisterPciTextReader(), ['0.4.0']);
            $this->setVersion('1.3.0');
        }

        $this->skip('1.3.0', '2.0.1');

        if ($this->isVersion('2.0.1')) {
            call_user_func(new RegisterPciTextReader(), ['0.5.0']);
            $this->setVersion('2.1.0');
        }

        if ($this->isVersion('2.1.0')) {
            $registry = (new IMSPciModel())->getRegistry();
            if($registry->has('textReaderInteraction')){
                $registry->removeAllVersions('textReaderInteraction');
            }
            call_user_func(new RegisterPciTextReader(), ['0.5.0']);
            $this->setVersion('2.1.1');
        }

        if ($this->isVersion('2.1.1')) {
            call_user_func(new RegisterPciTextReader(), ['0.7.0']);
            $this->setVersion('2.2.0');
        }

        if ($this->isVersion('2.2.0')) {
            call_user_func(new RegisterPciTextReader(), ['0.8.0']);
            $this->setVersion('2.3.0');
        }

        $this->skip('2.3.0', '2.3.1');

        if ($this->isVersion('2.3.1')) {
            call_user_func(new RegisterPciTextReader(), ['0.8.1']);
            $this->setVersion('2.3.2');
        }

        $this->skip('2.3.2', '2.3.4');
    }
}
