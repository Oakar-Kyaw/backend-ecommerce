import { ApiProperty } from "@nestjs/swagger";

class BaseErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: [] })
  error: string[];

  @ApiProperty({ type: String, nullable: true, example: null })
  data: string | null;

  @ApiProperty({ example: "2025-08-13T03:42:08.530Z" })
  timestamp: string;
}

export class ExistedDataResponseDto extends BaseErrorResponseDto {
  @ApiProperty({ example: ["Existed"] })
  declare error: string[];
}

export class NotFoundResponseDto extends BaseErrorResponseDto {
  @ApiProperty({ example: ["Not Found"] })
  declare error: string[];
}

export class UnauthorizeResponseDto extends BaseErrorResponseDto {
  @ApiProperty({ example: ["Unauthorized"] })
  declare error: string[];
}

export class ServerErrorResponseDto extends BaseErrorResponseDto {
  @ApiProperty({ example: ["Internal Server Error"] })
  declare error: string[];
}
