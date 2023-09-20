<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderOAT;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;

/**
 * Auto-generated Migration: Please modify to your needs!
 *
 * phpcs:disable Squiz.Classes.ValidClassName
 */
final class Version202309191438454106_pciSamples extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Update TextReader OAT & IMS PCIs to work with Handlebars 4';
    }

    public function up(Schema $schema): void
    {
        $this->addReport(
            $this->propagate(
                new RegisterPciTextReaderOAT()
            )(
                ['1.0.0']
            )
        );

        $this->addReport(
            $this->propagate(
                new RegisterPciTextReaderIMS()
            )(
                ['2.0.0']
            )
        );
    }

    public function down(Schema $schema): void
    {
        throw new IrreversibleMigration(
            'In order to undo this migration, restore the pre-Handlebars-4 versions of all the PCIs and run their registration scripts'
        );
    }
}
