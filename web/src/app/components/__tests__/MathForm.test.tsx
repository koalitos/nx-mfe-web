import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MathForm } from '../MathForm';
import { mathApi } from '../../services/mathApi';
import { HttpError } from '../../services/httpClient';

vi.mock('../../services/mathApi', () => ({
  mathApi: {
    add: vi.fn(),
  },
}));

describe('MathForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits numbers and renders API response', async () => {
    const addMock = vi.mocked(mathApi.add);
    addMock.mockResolvedValue({
      result: 7,
      logId: 'log-1',
      supabaseUserId: 'sup-1',
      recordedAt: '2024-01-01T10:00:00Z',
    });

    render(<MathForm />);

    const [firstInput, secondInput] = screen.getAllByRole('spinbutton');
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, '3');
    await userEvent.clear(secondInput);
    await userEvent.type(secondInput, '4');

    await userEvent.click(
      screen.getByRole('button', { name: /Chamar API protegida/i })
    );

    await waitFor(() => {
      const container = screen.getByText(/Resultado:/i).parentElement;
      expect(container?.textContent).toContain('7');
    });

    expect(addMock).toHaveBeenCalledWith({ a: 3, b: 4 });
    expect(screen.getByText(/logId/i)).toBeInTheDocument();
  });

  it('mostra erro quando API falha', async () => {
    const addMock = vi.mocked(mathApi.add);
    addMock.mockRejectedValue(
      new HttpError(500, { message: 'Falha no servico' })
    );

    render(<MathForm />);

    await userEvent.click(
      screen.getByRole('button', { name: /Chamar API protegida/i })
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Falha no servico')
    );
  });
});
