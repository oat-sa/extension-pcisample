<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\qtiItemPci\model\IMSPciModel;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use Doctrine\Migrations\Exception\IrreversibleMigration;
use oat\pciSamples\scripts\install\RegisterPciTextReaderIMS;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version202103160949554106_pciSamples extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Convert Text Reader interaction to IMS compliant';
    }

    public function up(Schema $schema): void
    {
        $registry = (new IMSPciModel())->getRegistry();
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
