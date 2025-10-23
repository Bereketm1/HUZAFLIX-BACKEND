import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

// Minimal local profile shape used by our code to avoid any-typed external types
type GoogleProfile = {
  id?: string;
  displayName?: string;
  emails?: Array<{ value?: string }>;
  name?:
    | { givenName?: string | undefined; familyName?: string | undefined }
    | undefined;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    // config.get can return unknown; we coerce values to string for the strategy options.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- safe: coercing config values for passport strategy
    super({
      clientID: String(config.get('GOOGLE_CLIENT_ID') ?? ''),
      clientSecret: String(config.get('GOOGLE_CLIENT_SECRET') ?? ''),
      callbackURL: String(
        config.get('GOOGLE_CALLBACK_URL') ??
          'http://localhost:3000/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: GoogleProfile) {
    const email =
      profile.emails && profile.emails[0] ? profile.emails[0].value : undefined;
    const name = profile.displayName
      ? profile.displayName
      : profile.name
        ? `${profile.name.givenName ?? ''} ${profile.name.familyName ?? ''}`.trim()
        : undefined;
    const googleId = profile.id;
    return { email, name: name || undefined, googleId };
  }
}
