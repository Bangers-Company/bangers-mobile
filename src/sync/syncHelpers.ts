import { actsRepository } from "../database/repositories/acts.repository";
import { artistsRepository } from "../database/repositories/artists.repository";
import { eventsRepository } from "../database/repositories/events.repository";

export const syncHelpers = {
  processEntityUpdates: async (entityType: string, data: any[]) => {
    const toUpsert: any[] = [];
    const toDelete: string[] = [];

    for (const item of data) {
      if (item.deleted_at) {
        toDelete.push(item.id);
      } else {
        toUpsert.push(item);
      }
    }

    if (toUpsert.length > 0) {
      await syncHelpers.batchHandleUpsert(entityType, toUpsert);
    }
    if (toDelete.length > 0) {
      await syncHelpers.batchHandleDelete(entityType, toDelete);
    }
  },

  batchHandleUpsert: async (entityType: string, items: any[]) => {
    switch (entityType) {
      case "events":
        await eventsRepository.batchUpsert(items);
        break;
      case "artists":
        await artistsRepository.batchUpsert(items);
        break;
      case "acts":
        await actsRepository.batchUpsert(items);
        break;
    }
  },

  batchHandleDelete: async (entityType: string, ids: string[]) => {
    switch (entityType) {
      case "events":
        await eventsRepository.batchHardDelete(ids);
        break;
      case "artists":
        await artistsRepository.batchHardDelete(ids);
        break;
      case "acts":
        await actsRepository.batchHardDelete(ids);
        break;
    }
  },

  // Legacy individual handlers if needed, but discouraged for sync
  handleUpsert: async (entityType: string, item: any) => {
    await syncHelpers.batchHandleUpsert(entityType, [item]);
  },

  handleDelete: async (entityType: string, id: string) => {
    await syncHelpers.batchHandleDelete(entityType, [id]);
  },
};
