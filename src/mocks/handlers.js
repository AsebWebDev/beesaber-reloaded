import apiPlayerHandlers from '@/api/services/apiPlayer/apiPlayerHandler';
import apiUserHandlers from '@/api/services/apiUser/apiUserHandler';

const handlers = [...apiUserHandlers, ...apiPlayerHandlers];

export default handlers;
