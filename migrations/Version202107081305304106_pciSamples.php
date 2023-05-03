<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\qtiItemPci\model\PciModel;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;
use oat\pciSamples\scripts\install\RegisterPciTextReaderOAT;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202107081305304106_pciSamples extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Restore the previous version of the Text Reader interaction';
    }

    public function up(Schema $schema): void
    {
        $registry = (new PciModel())->getRegistry();
        if ($registry->has('textReaderInteraction')) {
            /** @noinspection PhpUnhandledExceptionInspection */
            $registry->removeAllVersions('textReaderInteraction');
        }

        $this->addReport(
            $this->propagate(
                new RegisterPciTextReaderOAT()
            )(
                ['0.9.0']
            )
        );
        $this->addReport(
            $this->propagate(
                new RegisterPciTextReaderIMS()
            )(
                ['1.0.0']
            )
        );
    }

    public function down(Schema $schema): void
    {
        $registry = (new PciModel())->getRegistry();
        if ($registry->has('textReaderInteraction')) {
            /** @noinspection PhpUnhandledExceptionInspection */
            $registry->removeAllVersions('textReaderInteraction');
        }

        $this->addReport(
            $this->propagate(
                new RegisterPciTextReaderIMS()
            )(
                ['1.0.0']
            )
        );
    }
}
