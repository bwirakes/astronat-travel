import { Redirect } from 'expo-router';

export default function MundaneRoute() {
  return <Redirect href="/reading/new?type=weather&intent=mundane" />;
}
