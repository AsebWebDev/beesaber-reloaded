/* eslint-disable no-console */
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { MDBBtn, MDBIcon, MDBInput } from 'mdb-react-ui-kit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import errHandler from '@/api/errHandler';
import {
  useGetPlayerByIdQuery,
  useIsValidPlayerIdQuery,
} from '@/api/services/apiPlayer/apiPlayer';
import {
  useGetUserDataQuery,
  useUpdateUserDataMutation,
} from '@/api/services/apiUser/apiUser';
import Spinner from '@/components/common/Spinner/SpinnerPulse';
import parseId from '@/helper/parseEmptyStringToUndefined';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUserId, userDataUpdated } from '@/store/reducer/userDataReducer';

import type { ChangeEvent } from 'react';
import type { PossibleResponses } from '@/api/errHandler';

const IdForm = styled.form`
  display: flex;
  align-items: center;
`;

const IdInput = (): JSX.Element | null => {
  const userId = useAppSelector(selectUserId);
  const { data: userDataResult, isLoading } = useGetUserDataQuery(
    parseId(userId) ?? skipToken
  );
  const [updateUser] = useUpdateUserDataMutation();
  const myScoreSaberId = userDataResult?.myScoreSaberId;

  const [idInput, setIdInput] = useState<string | undefined>(myScoreSaberId);

  const { data: fullPlayer } = useGetPlayerByIdQuery(
    parseId(idInput) ?? skipToken
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setIdInput(e.target.value);

  const dispatch = useAppDispatch();

  const { data: isValidId } = useIsValidPlayerIdQuery(
    parseId(idInput) ?? skipToken
  );
  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (userId === undefined || idInput === undefined || isValidId !== true)
      return;

    try {
      const userData = {
        myScoreSaberId: idInput,
        totalPlayCount: fullPlayer?.scoreStats.totalPlayCount,
        playerInfo: fullPlayer?.playerInfo,
      };
      const updatedUserData = await updateUser({ userId, userData }).unwrap();

      dispatch(userDataUpdated(updatedUserData));
      toast.success('ID successfully saved');
    } catch (err: unknown) {
      errHandler(err as PossibleResponses);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <IdForm>
      <MDBInput
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
        label="Your ScoreSaber ID"
        icon="user"
        group="true"
        type="text"
        validate="true"
        error="wrong"
        success="right"
        // we need to pass in an empty string for MDBInput instead undefined
        value={idInput !== undefined ? idInput : ''}
      />
      <MDBBtn
        onClick={handleSave}
        size="sm"
        disabled={myScoreSaberId === idInput}
        outline
        color="secondary"
      >
        Save
        <MDBIcon far icon="paper-plane" className="ml-1" />
      </MDBBtn>
    </IdForm>
  );
};

export default IdInput;
