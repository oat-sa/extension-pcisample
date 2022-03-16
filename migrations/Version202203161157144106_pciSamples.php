<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;
use oat\pciSamples\scripts\install\RegisterPciTextReaderOAT;
use oat\qtiItemPci\model\IMSPciModel;
use oat\qtiItemPci\model\PciModel;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\taoQtiItem\model\portableElement\action\RegisterPortableElement;
use oat\taoQtiItem\model\portableElement\model\PortableElementModel;

final class Version202203161157144106_pciSamples extends AbstractMigration
{
    private const RESTORED_PORTABLE_ELEMENT_IDENTIFIER = 'textReaderInteraction';
    private const RESTORED_OAT_PORTABLE_ELEMENT_VERSION = '0.9.0';
    private const RESTORED_IMS_PORTABLE_ELEMENT_VERSION = '1.1.1';

    public function getDescription(): string
    {
        return sprintf(
            'Restore PciModel of `%s` versions `%s`',
            self::RESTORED_PORTABLE_ELEMENT_IDENTIFIER,
            implode(
                ', ',
                [self::RESTORED_OAT_PORTABLE_ELEMENT_VERSION, self::RESTORED_IMS_PORTABLE_ELEMENT_VERSION]
            )
        );
    }

    public function up(Schema $schema): void
    {
        $this->restoreInteraction(
            new PciModel(),
            new RegisterPciTextReaderOAT(),
            self::RESTORED_OAT_PORTABLE_ELEMENT_VERSION
        );
        $this->restoreInteraction(
            new IMSPciModel(),
            new RegisterPciTextReaderIMS(),
            self::RESTORED_IMS_PORTABLE_ELEMENT_VERSION
        );
    }

    public function down(Schema $schema): void
    {
        throw new IrreversibleMigration();
    }

    private function restoreInteraction(
        PortableElementModel $model,
        RegisterPortableElement $registerPortableElement,
        string $version
    ): void {
        $registry = $model->getRegistry();
        if ($registry->has('textReaderInteraction')) {
            /** @noinspection PhpUnhandledExceptionInspection */
            $registry->removeAllVersions('textReaderInteraction');
        }

        $this->addReport(
            $this->propagate($registerPortableElement)([$version])
        );
    }
}
