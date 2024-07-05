<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;
use oat\pciSamples\scripts\install\RegisterPciTextReaderOAT;
use oat\tao\scripts\tools\migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 *
 * phpcs:disable Squiz.Classes.ValidClassName
 */
final class Version202407021254084106_pciSamples extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add target "_blank" to any HTML anchors of Text Reader interaction';
    }

    public function up(Schema $schema): void
    {
        $this->runAction(new RegisterPciTextReaderOAT(), ['0.9.2']);
        $this->runAction(new RegisterPciTextReaderIMS(), ['1.2.2']);
    }

    public function down(Schema $schema): void
    {
        throw new IrreversibleMigration(
            sprintf(
                'In order to undo this migration, please revert the client-side changes and run "%s" and "%s"',
                RegisterPciTextReaderIMS::class,
                RegisterPciTextReaderOAT::class
            )
        );
    }
}
