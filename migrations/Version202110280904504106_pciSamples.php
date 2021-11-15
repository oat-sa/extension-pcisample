<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;
use oat\qtiItemPci\model\PciModel;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202110280904504106_pciSamples extends AbstractMigration
{

    public function getDescription(): string
    {
        return 'Add basic keyboard navigation to the TextReaderInteraction';
    }

    public function up(Schema $schema): void
    {
        $registry = (new PciModel())->getRegistry();
        if ($registry->has('textReaderInteraction')) {
            $registry->removeAllVersions('textReaderInteraction');
        }
        $this->addReport(
            $this->propagate(
                new RegisterPciTextReaderIMS()
            )(
                ['1.1.0']
            )
        );
    }

    public function down(Schema $schema): void
    {
         throw new IrreversibleMigration('In order to undo this migration, please revert the client-side changes and run ' . RegisterPciTextReaderIMS::class
        );

    }
}
