<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;
use oat\tao\scripts\tools\migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 *
 * phpcs:disable Squiz.Classes.ValidClassName
 */
final class Version202411081031324106_pciSamples extends AbstractMigration
{
   public function getDescription(): string
    {
        return 'Update TextReader IMS PCI to support image wrap';
    }

    public function up(Schema $schema): void
    {
        $this->runAction(new RegisterPciTextReaderIMS(), ['1.3.2']);
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
