import { Injectable, NotFoundException } from '@nestjs/common';

import { Link, CreateLinkDto, UpdateLinkDto } from '@repo/backend';

@Injectable()
export class LinksService {
  private _nextId = 3;
  private readonly _links: Link[] = [
    {
      id: 0,
      title: 'Installation',
      url: 'https://turborepo.dev/docs/getting-started/installation',
      description: 'Get started with Turborepo in a few moments using',
    },
    {
      id: 1,
      title: 'Crafting',
      url: 'https://turborepo.dev/docs/crafting-your-repository',
      description: 'Architecting a monorepo is a careful process.',
    },
    {
      id: 2,
      title: 'Add Repositories',
      url: 'https://turborepo.dev/docs/getting-started/add-to-existing-repository',
      description:
        'Turborepo can be incrementally adopted in any repository, single or multi-package, to speed up the developer and CI workflows of the repository.',
    },
  ];

  create(createLinkDto: CreateLinkDto): Link {
    const link: Link = { id: this._nextId++, ...createLinkDto };
    this._links.push(link);
    return link;
  }

  findAll(): Link[] {
    return this._links;
  }

  findOne(id: number): Link {
    const link = this._links.find((l) => l.id === id);
    if (!link) {
      throw new NotFoundException(`Link with id #${id} not found`);
    }
    return link;
  }

  update(id: number, updateLinkDto: UpdateLinkDto): Link {
    const link = this.findOne(id);
    Object.assign(link, updateLinkDto);
    return link;
  }

  remove(id: number): Link {
    const index = this._links.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new NotFoundException(`Link with id #${id} not found`);
    }
    return this._links.splice(index, 1)[0];
  }
}
