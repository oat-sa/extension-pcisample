<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;
use oat\pciSamples\scripts\install\RegisterPciTextReaderOAT;
use oat\tao\scripts\tools\migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 *
 * phpcs:disable Squiz.Classes.ValidClassName
 */
final class Version202402071602394106_pciSamples extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Update TextReader OAT & IMS PCIs to work with lodash 4';
    }

    public function up(Schema $schema): void
    {
        $this->runAction(new RegisterPciTextReaderOAT(), ['0.9.1']);
        $this->runAction(new RegisterPciTextReaderIMS(), ['1.1.3']);
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('In order to undo this migration, restore the pre-lodash-4 versions of TextReader PCIs and run their registration scripts');
    }
}
