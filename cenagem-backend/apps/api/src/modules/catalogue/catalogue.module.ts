import { Module } from '@nestjs/common';
import { CatalogueService } from './catalogue.service';

@Module({
  providers: [CatalogueService],
  exports: [CatalogueService],
})
export class CatalogueModule {}
