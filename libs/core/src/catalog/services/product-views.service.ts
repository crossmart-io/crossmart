import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProductView } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { MAX_PRODUCT_VIEWS } from '../catalog.constants.js';
import type { ProductViewDraft, SavedProductView } from '../entities/product-view.js';
import { CatalogGap } from '../enums/catalog-gap.enum.js';
import { ProductViewRepository } from '../repositories/product-view.repository.js';

const VIEW_NOT_FOUND = 'Saved view not found';
const TOO_MANY_VIEWS = `A workspace can save up to ${MAX_PRODUCT_VIEWS} views`;

/** Saved filters of the product list, shared by everyone in the workspace. */
@Injectable()
export class ProductViewsService {
  constructor(
    private readonly views: ProductViewRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  async list(workspaceId: string): Promise<SavedProductView[]> {
    return (await this.views.list(workspaceId)).map(toSavedView);
  }

  async create(
    workspaceId: string,
    input: ProductViewDraft,
    actor: Actor,
  ): Promise<SavedProductView> {
    const draft = { ...input, name: input.name.trim(), search: input.search?.trim() || undefined };
    if (await this.views.nameTaken(workspaceId, draft.name)) {
      throw new ConflictException(`A view named ${draft.name} already exists`);
    }
    if ((await this.views.count(workspaceId)) >= MAX_PRODUCT_VIEWS) {
      throw new BadRequestException(TOO_MANY_VIEWS);
    }
    const view = toSavedView(await this.views.create(workspaceId, draft));
    await this.recordChange(workspaceId, actor, ActivityAction.ProductViewCreated, view);
    return view;
  }

  async delete(workspaceId: string, viewId: string, actor: Actor): Promise<void> {
    const deleted = await this.views.delete(workspaceId, viewId);
    if (!deleted) {
      throw new NotFoundException(VIEW_NOT_FOUND);
    }
    await this.recordChange(workspaceId, actor, ActivityAction.ProductViewDeleted, {
      id: viewId,
      name: deleted.name,
    });
  }

  private recordChange(
    workspaceId: string,
    actor: Actor,
    action: ActivityAction,
    view: Pick<SavedProductView, 'id' | 'name'>,
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action,
      subject: { type: ActivitySubjectType.ProductView, id: view.id, label: view.name },
    });
  }
}

function toCatalogGap(value: string | null): CatalogGap | undefined {
  return Object.values(CatalogGap).find((gap) => gap === value);
}

function toSavedView(record: ProductView): SavedProductView {
  return {
    id: record.id,
    name: record.name,
    search: record.search ?? undefined,
    status: record.status ?? undefined,
    gap: toCatalogGap(record.gap),
    createdAt: record.createdAt,
  };
}
