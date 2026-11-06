import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EBAY_CHALLENGE_CODE_MAX_LENGTH } from '../channels.constants.js';

/** The query of eBay's endpoint challenge: `GET …/account-deletion?challenge_code=…`. */
export class EbayChallengeQueryDto {
  /** Named by eBay. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(EBAY_CHALLENGE_CODE_MAX_LENGTH)
  challenge_code: string;
}

/** What eBay expects back: the hex SHA-256 of the code, the verification token and the URL. */
export class EbayChallengeResponseDto {
  challengeResponse: string;
}
