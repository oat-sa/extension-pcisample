<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;
use oat\qtiItemPci\model\IMSPciModel;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use Doctrine\Migrations\Exception\IrreversibleMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202310250623044106_pciSamples extends AbstractMigration
{

    public function getDescription(): string
    {
        return 'Fix text reader PCI tooltip in the IMS version';
    }

    public function up(Schema $schema): void
    {
        $registry = (new IMSPciModel())->getRegistry();
        $this->addReport(
            $this->propagate(new RegisterPciTextReaderIMS())(['1.1.2'])
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
