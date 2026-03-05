import { actsRepository } from "../database/repositories/acts.repository";
import { artistsRepository } from "../database/repositories/artists.repository";
import { eventsRepository } from "../database/repositories/events.repository";

export const syncHelpers = {
  processEntityUpdates: async (entityType: string, data: any[]) => {
    for (const item of data) {
      if (item.deleted_at) {
        await syncHelpers.handleDelete(entityType, item.id);
      } else {
        await syncHelpers.handleUpsert(entityType, item);
      }
    }
  },

  handleUpsert: async (entityType: string, item: any) => {
    switch (entityType) {
      case "events":
        await eventsRepository.upsert(item);
        break;
      case "artists":
        await artistsRepository.upsert(item);
        break;
      case "acts":
        await actsRepository.upsert(item);
        break;
    }
  },

  handleDelete: async (entityType: string, id: string) => {
    switch (entityType) {
      case "events":
        await eventsRepository.hardDelete(id);
        break;
      case "artists":
        await artistsRepository.hardDelete(id);
        break;
      case "acts":
        await actsRepository.hardDelete(id);
        break;
    }
  },
};
