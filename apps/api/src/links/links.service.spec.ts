import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { LinksService } from './links.service';

describe('LinksService', () => {
  let service: LinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinksService],
    }).compile();

    service = module.get<LinksService>(LinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of links', () => {
      const links = service.findAll();
      expect(links).toBeInstanceOf(Array);
      expect(links.length).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a link by id', () => {
      const link = service.findOne(0);
      expect(link).toBeDefined();
      expect(link.id).toBe(0);
    });

    it('should throw NotFoundException for non-existent id', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new link', () => {
      const dto = { title: 'Test', url: 'https://test.com', description: 'A test link' };
      const link = service.create(dto);
      expect(link.title).toBe('Test');
      expect(link.id).toBeDefined();
      expect(service.findAll().length).toBe(4);
    });
  });

  describe('update', () => {
    it('should update and return the link', () => {
      const updated = service.update(0, { title: 'Updated' });
      expect(updated.title).toBe('Updated');
    });

    it('should throw NotFoundException for non-existent id', () => {
      expect(() => service.update(999, { title: 'X' })).toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove and return the link', () => {
      const removed = service.remove(0);
      expect(removed.id).toBe(0);
      expect(service.findAll().length).toBe(2);
    });

    it('should throw NotFoundException for non-existent id', () => {
      expect(() => service.remove(999)).toThrow(NotFoundException);
    });
  });
});
