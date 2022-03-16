<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\qtiItemPci\model\IMSPciModel;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202201111538504106_pciSamples extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fix text reader PCI destroy lifecycle';
    }

    public function up(Schema $schema): void
    {
        $registry = (new IMSPciModel())->getRegistry();
        if ($registry->has('textReaderInteraction')) {
            $registry->removeAllVersions('textReaderInteraction');
        }
        $this->addReport(
            $this->propagate(new RegisterPciTextReaderIMS())(['1.1.1'])
        );
    }

    public function down(Schema $schema): void
    {
        throw new IrreversibleMigration(
            sprintf(
                'In order to undo this migration, please revert the client-side changes and run %s',
                RegisterPciTextReaderIMS::class
            )
        );
    }
}
