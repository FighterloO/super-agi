import * as React from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Box, Button, FormControl, FormHelperText, IconButton, Input, Stack, Typography } from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import YouTubeIcon from '@mui/icons-material/YouTube';

import { extractYoutubeVideoIDFromURL } from '~/modules/youtube/youtube.utils';

import { GoodModal } from '~/common/components/modals/GoodModal';
import { addSnackbar } from '~/common/components/snackbar/useSnackbarsStore';
import { asValidURL } from '~/common/util/urlUtils';


// configuration
const MAX_URLS = 5;


type WebInputModalInputs = {
  urls: { value: string }[];
}


function WebInputModal(props: {
  onClose: () => void,
  onWebLinks: (urls: string[]) => void,
}) {

  // state
  const { control: formControl, handleSubmit: formHandleSubmit, formState: { isValid: formIsValid, isDirty: formIsDirty } } = useForm<WebInputModalInputs>({
    values: { urls: [{ value: '' }] },
    // mode: 'onChange', // validate on change
  });
  const { fields: formFields, append: formFieldsAppend, remove: formFieldsRemove } = useFieldArray({ control: formControl, name: 'urls' });

  // derived
  const urlFieldCount = formFields.length;


  // handlers

  const { onClose, onWebLinks } = props;

  const handleClose = React.useCallback(() => onClose(), [onClose]);

  const handleSubmit = React.useCallback(({ urls }: WebInputModalInputs) => {
    // clean and prefix URLs
    const cleanUrls = urls.reduce((acc, { value }) => {
      const trimmed = (value || '').trim();
      if (!trimmed) return acc;
      // noinspection HttpUrlsUsage
      const normalized = (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
        ? 'https://' + trimmed
        : trimmed;
      if (asValidURL(normalized))
        acc.push(normalized);
      return acc;
    }, [] as string[]);
    if (!cleanUrls.length) {
      addSnackbar({ key: 'invalid-urls', message: 'Please enter at least one valid web address', type: 'issue', overrides: { autoHideDuration: 2000 } });
      return;
    }
    onWebLinks(cleanUrls);
    handleClose();
  }, [handleClose, onWebLinks]);


  return (
    <GoodModal
      open
      onClose={handleClose}
      title='Add Web Content'
      titleStartDecorator={<LanguageRoundedIcon />}
      closeText={'Cancel'}
      hideBottomClose
    >
      <Box fontSize='sm'>
        Enter or paste web page addresses to import their content.
      </Box>
      <Typography level='body-sm'>
        Works on most websites and for YouTube videos (e.g., youtube.com/...) the transcript will be imported.
        {/*You can add up to {MAX_URLS} URLs.*/}
      </Typography>

      <form onSubmit={formHandleSubmit(handleSubmit)}>
        <Stack spacing={1}>
          {formFields.map((field, index) => (
            <Controller
              key={field.id}
              control={formControl}
              name={`urls.${index}.value`}
              rules={{ required: 'Please enter a valid URL' }}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <FormControl error={!!error}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Input
                      autoFocus={index === 0}
                      required={index === 0}
                      placeholder='https://...'
                      endDecorator={extractYoutubeVideoIDFromURL(value) ? <YouTubeIcon sx={{ color: 'red' }} /> : undefined}
                      value={value}
                      onChange={onChange}
                      sx={{ flex: 1 }}
                    />
                    {urlFieldCount > 1 && (
                      <IconButton
                        size='sm'
                        variant='plain'
                        color='neutral'
                        onClick={() => formFieldsRemove(index)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}
                  </Box>
                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          ))}
        </Stack>

        {/* Add a new link */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 2.5 }}>

          {formIsDirty && <Button
            color='neutral'
            variant='soft'
            disabled={urlFieldCount >= MAX_URLS}
            onClick={() => formFieldsAppend({ value: '' })}
            startDecorator={<AddIcon />}
          >
            Another
            {/*{urlFieldCount >= MAX_URLS ? 'Enough URLs' : urlFieldCount === 1 ? 'Add URL' : urlFieldCount === 2 ? 'Add another' : urlFieldCount === 3 ? 'And another one' : urlFieldCount === 4 ? 'Why stopping' : 'Just one more'}*/}
          </Button>}

          <Button
            variant='solid'
            type='submit'
            disabled={!formIsValid || !formIsDirty}
            sx={{ minWidth: 160, ml: 'auto' }}
          >
            Add {urlFieldCount > 1 ? `(${urlFieldCount})` : ''}
          </Button>

        </Box>
      </form>

    </GoodModal>
  );
}


export function useWebInputModal(onAttachWebLinks: (urls: string[]) => void) {

  // state
  const [open, setOpen] = React.useState(false);

  const openWebInputDialog = React.useCallback(() => setOpen(true), []);

  const webInputDialogComponent = React.useMemo(() => open && (
    <WebInputModal
      onClose={() => setOpen(false)}
      onWebLinks={onAttachWebLinks}
    />
  ), [onAttachWebLinks, open]);

  return {
    openWebInputDialog,
    webInputDialogComponent,
  };
}