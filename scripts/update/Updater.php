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
 */

namespace oat\pciSamples\scripts\update;

use common_ext_ExtensionUpdater;
use oat\pciSamples\scripts\install\RegisterPciTextReaderOAT;
use oat\qtiItemPci\model\IMSPciModel;
use oat\taoQtiItem\model\HookRegistry;

/**
 * @deprecated use migrations instead. See https://github.com/oat-sa/generis/wiki/Tao-Update-Process
 */
class Updater extends common_ext_ExtensionUpdater
{
    /**
     * @param string $currentVersion
     * @param mixed $initialVersion
     *
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
            call_user_func(new RegisterPciTextReaderOAT(), ['0.4.0']);
            $this->setVersion('1.3.0');
        }

        $this->skip('1.3.0', '2.0.1');

        if ($this->isVersion('2.0.1')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.5.0']);
            $this->setVersion('2.1.0');
        }

        if ($this->isVersion('2.1.0')) {
            $registry = (new IMSPciModel())->getRegistry();

            if ($registry->has('textReaderInteraction')) {
                $registry->removeAllVersions('textReaderInteraction');
            }
            call_user_func(new RegisterPciTextReaderOAT(), ['0.5.0']);
            $this->setVersion('2.1.1');
        }

        if ($this->isVersion('2.1.1')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.7.0']);
            $this->setVersion('2.2.0');
        }

        if ($this->isVersion('2.2.0')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.8.0']);
            $this->setVersion('2.3.0');
        }

        $this->skip('2.3.0', '2.3.1');

        if ($this->isVersion('2.3.1')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.8.1']);
            $this->setVersion('2.3.2');
        }

        $this->skip('2.3.2', '2.5.0');

        if ($this->isVersion('2.5.0')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.8.2']);
            $this->setVersion('2.5.1');
        }

        if ($this->isVersion('2.5.1')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.8.3']);
            $this->setVersion('2.5.2');
        }

        if ($this->isVersion('2.5.2')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.8.4']);
            $this->setVersion('2.5.3');
        }

        if ($this->isVersion('2.5.3')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.8.5']);
            $this->setVersion('2.5.4');
        }

        $this->skip('2.5.4', '2.7.0');

        if ($this->isVersion('2.7.0')) {
            call_user_func(new RegisterPciTextReaderOAT(), ['0.9.0']);
            $this->setVersion('2.8.0');
        }
        $this->skip('2.8.0', '2.9.1');

        //Updater files are deprecated. Please use migrations.
        //See: https://github.com/oat-sa/generis/wiki/Tao-Update-Process

        $this->setVersion($this->getExtension()->getManifest()->getVersion());
    }
}
