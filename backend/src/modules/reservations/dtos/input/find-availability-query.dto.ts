import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsString, Matches, Min } from 'class-validator';

export class FindAvailabilityQueryDto {
  @ApiProperty({
    type: Number,
    format: 'int32',
    minimum: 1,
    description: 'Identificador del médico.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId: number;

  @ApiProperty({
    type: String,
    format: 'date',
    description:
      'Fecha de calendario en formato YYYY-MM-DD, desde hoy hasta los próximos 30 días inclusive, según la hora de Argentina.',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  date: string;
}
