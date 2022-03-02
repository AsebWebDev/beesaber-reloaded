import apiAuthHandlers from '@/api/services/apiAuth/apiAuthHandlers';
import apiPlayerHandlers from '@/api/services/apiPlayer/apiPlayerHandler';
import apiUserHandlers from '@/api/services/apiUser/apiUserHandler';

const handlers = [...apiUserHandlers, ...apiPlayerHandlers, ...apiAuthHandlers];

export default handlers;
