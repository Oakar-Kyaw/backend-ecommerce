// facebook.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { envConfig } from 'libs/config/envConfig';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: envConfig().FACEBOOK_APP_ID, // Facebook App ID
      clientSecret: envConfig().FACEBOOK_CLIENT_SECRET, //Facebook App Secret
      callbackURL: envConfig().FACEBOOK_USER_CALLBACK_URL, //callback URL
      scope: ['email', 'public_profile', 'user_birthday', 'user_gender', 'user_location', 'user_link'], // ask for more permissions
      profileFields: [
        'id',
        'name',
        'gender',
        'birthday',
        'emails',
        'picture.type(large)',
        'location',
        'timezone',
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    console.log('Facebook Profile:', profile);
    const { last_name, first_name, gender, birthday, email, picture } = profile._json;
    console.log('Extracted Info:', profile._json, picture, last_name, first_name, gender, birthday, email);
    // Simple user object from profile
    const user = {
      firstName: first_name,
      lastName: last_name,
      gender,
      birthday,
      email,
      photoUrl: picture?.data?.url ?? null,
    };

    done(null, user);
  }
}
