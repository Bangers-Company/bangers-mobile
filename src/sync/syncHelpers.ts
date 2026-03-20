import { actsRepository } from "../database/repositories/acts.repository";
import { artistsRepository } from "../database/repositories/artists.repository";
import { eventsRepository } from "../database/repositories/events.repository";
import { Event } from "../types/event";
import { Artist } from "../types/artist";
import { Act } from "../types/act";

type SyncItem = Event | Artist | Act;

const syncRegistry = new Map<string, { 
  batchUpsert: (items: any[]) => Promise<void>; 
  batchHardDelete: (ids: string[]) => Promise<void>; 
}>();

syncRegistry.set("events", eventsRepository);
syncRegistry.set("artists", artistsRepository);
syncRegistry.set("acts", actsRepository);

export const syncHelpers = {
  processEntityUpdates: async (entityType: string, data: SyncItem[]) => {
    const toUpsert: SyncItem[] = [];
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

  batchHandleUpsert: async (entityType: string, items: SyncItem[]) => {
    const repo = syncRegistry.get(entityType);
    if (!repo) throw new Error(`Unknown entity type: ${entityType}`);
    await repo.batchUpsert(items);
  },

  batchHandleDelete: async (entityType: string, ids: string[]) => {
    const repo = syncRegistry.get(entityType);
    if (!repo) throw new Error(`Unknown entity type: ${entityType}`);
    await repo.batchHardDelete(ids);
  },

  handleUpsert: async (entityType: string, item: any) => {
    await syncHelpers.batchHandleUpsert(entityType, [item]);
  },

  handleDelete: async (entityType: string, id: string) => {
    await syncHelpers.batchHandleDelete(entityType, [id]);
  },
};
