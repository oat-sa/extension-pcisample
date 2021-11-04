<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202110280904504106_pciSamples extends AbstractMigration
{

    public function getDescription(): string
    {
        return 'Add basic keayboard navigation to the TextReaderInteraction';
    }

    public function up(Schema $schema): void
    {
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
         $this->addReport(
            $this->propagate(
                new RegisterPciTextReaderIMS()
            )(
                ['1.0.0']
            )
        );

    }
}
