<?php

declare(strict_types=1);

namespace oat\pciSamples\migrations;

use Doctrine\DBAL\Schema\Schema;
use oat\tao\scripts\tools\migrations\AbstractMigration;
use oat\oatbox\event\EventManager;
use oat\taoQtiItem\model\event\ItemImported;
use oat\pciSamples\model\event\UpgardeTextReaderInteractionListener;

final class Version202301100820384106_pciSamples extends AbstractMigration
{

    public function getDescription(): string
    {
        return 'Register UpgardeTextReaderInteractionListener events';
    }

    public function up(Schema $schema): void
    {
        $eventManager = $this->getServiceLocator()->get(EventManager::SERVICE_ID);

        $eventManager->attach(
            ItemImported::class,
            [UpgardeTextReaderInteractionListener::class, 'whenItemImport']
        );

        $this->getServiceManager()->register(EventManager::SERVICE_ID, $eventManager);
    }

    public function down(Schema $schema): void
    {
        $eventManager = $this->getServiceLocator()->get(EventManager::SERVICE_ID);

        $eventManager->detach(
            ItemImported::class,
            [UpgardeTextReaderInteractionListener::class, 'whenItemImport']
        );

        $this->getServiceManager()->register(EventManager::SERVICE_ID, $eventManager);
    }
}
